const rp = require('request-promise')
const WebSocket = require('ws')
const ethers = require('ethers')
const uuid = require('uuid4')
const { AIRSWAP_TOKEN_METADATA_URL } = require('../constants.js')

const { Wallet, utils } = ethers
const TIMEOUT = 6000
const INDEXER_ADDRESS = '0x0000000000000000000000000000000000000000'

module.exports = class AirSwap {
  constructor() {
    this.name = 'AirSwap'

    // Create an ethereum wallet object for communicating on the protocol
    this.wallet = Wallet.createRandom()

    // Set the websocket url based on environment
    this.socketUrl = 'wss://connect.airswap-api.com/websocket'
    this.metadataUrl = AIRSWAP_TOKEN_METADATA_URL

    // Websocket authentication state
    this.isAuthenticated = false

    // Promise resolvers/rejectors and timeouts for each call
    this.RESOLVERS = {}
    this.REJECTORS = {}
    this.TIMEOUTS = {}

    this.getOrders = this.getOrders.bind(this)
    this.disconnect = this.disconnect.bind(this)
  }

  getTokenMetadata() {
    const config = {
      uri: this.metadataUrl,
      method: 'GET',
      json: true,
    }
    return rp(config)
  }

  async computePrice(symbol, desiredAmount, isSell) {
    let result = {}
    try {
      const tokenMetadata = await this.getTokenMetadata()
      const tokenObj = tokenMetadata.find(token => !token.banned && token.symbol === symbol)
      const noOrderError = new Error('No one responded with an order')
      const unavailableError = new Error(`${symbol} is not available on ${this.name}`)
      if (!tokenObj) throw unavailableError
      const tokenDecimals = parseInt(tokenObj.decimals, 10)
      let decimalAdjustedAmount

      if (tokenDecimals === 0) {
        decimalAdjustedAmount = desiredAmount
      } else {
        decimalAdjustedAmount = utils.parseUnits(String(desiredAmount), tokenDecimals)
      }

      await this.connect()

      const intents = isSell
        ? await this.findIntents(['0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'], [tokenObj.address])
        : await this.findIntents([tokenObj.address], ['0x0000000000000000000000000000000000000000'])
      if (!intents || !intents.length) throw unavailableError

      const orders = isSell
        ? await this.getOrders(intents, null, decimalAdjustedAmount)
        : await this.getOrders(intents, decimalAdjustedAmount)
      if (!orders || !orders.length) throw noOrderError

      const [bestOrder] = orders.sort((a, b) => {
        if (a.makerAmount && !b.makerAmount) return -1
        if (b.makerAmount && !a.makerAmount) return 1
        if (a.makerAmount && b.makerAmount) {
          return parseInt(a.makerAmount, 10) > parseInt(b.makerAmount, 10) ? -1 : 1
        }
        return 0
      })

      if (!bestOrder.makerAmount || !bestOrder.takerAmount) {
        throw noOrderError
      }

      const formattedMakerAmount = isSell
        ? utils.formatUnits(bestOrder.makerAmount, 18)
        : utils.formatUnits(bestOrder.makerAmount, tokenDecimals)
      const formattedTakerAmount = isSell
        ? utils.formatUnits(bestOrder.takerAmount, tokenDecimals)
        : utils.formatUnits(bestOrder.takerAmount, 18)

      result = {
        totalPrice: parseFloat(isSell ? formattedMakerAmount : formattedTakerAmount),
        tokenAmount: parseFloat(isSell ? formattedTakerAmount : formattedMakerAmount),
        tokenSymbol: symbol,
        avgPrice: isSell ? formattedMakerAmount / formattedTakerAmount : formattedTakerAmount / formattedMakerAmount,
      }
    } catch (e) {
      result = e.message
    }
    this.disconnect()
    return { [this.name]: result }
  }

  // RPC Methods
  // ----------------

  // Prepare a formatted query to be submitted as a JSON-RPC call
  static makeRPC(method, params = {}, id = uuid()) {
    return {
      jsonrpc: '2.0',
      method,
      params,
      id,
    }
  }

  // Send a JSON-RPC `message` to a `receiver` address.
  // Optionally pass `resolve` and `reject` callbacks to handle a response
  call(receiver, message, resolve, reject) {
    const messageString = JSON.stringify({
      sender: this.wallet.address.toLowerCase(),
      receiver,
      message: JSON.stringify(message),
      id: uuid(),
    })
    this.socket.send(messageString)

    // Set the promise resolvers and rejectors for this call
    if (typeof resolve === 'function') {
      this.RESOLVERS[message.id] = resolve
    }
    if (typeof reject === 'function') {
      this.REJECTORS[message.id] = reject
    }

    // Set a timeout for this call
    this.TIMEOUTS[message.id] = setTimeout(() => {
      if (typeof reject === 'function') {
        reject({ message: `Request timed out. [${message.id}]`, code: -1 })
      }
    }, TIMEOUT)
  }

  // WebSocket Interaction
  // ----------------

  // Connect to AirSwap by opening websocket. The sequence:
  // 1. Open a websocket connection
  // 2. Receive a challenge (some random data to sign)
  // 3. Sign the data and send it back over the wire
  // 4. Receive an "ok" and start sending and receiving RPC
  connect(reconnect = false) {
    this.socket = new WebSocket(this.socketUrl)

    // Check socket health every 30 seconds
    this.socket.onopen = function healthCheck() {
      this.isAlive = true
      this.addEventListener('pong', () => {
        this.isAlive = true
      })

      this.interval = setInterval(() => {
        if (this.isAlive === false) {
          console.log('no response for 30s; closing socket')
          this.close()
        }
        this.isAlive = false
        this.ping()
      }, 30000)
    }

    // The connection was closed
    this.socket.onclose = () => {
      this.isAuthenticated = false
      clearInterval(this.socket.interval)
      if (reconnect) {
        console.log(
          'socket closed. this is usually because the system lost its connection to the internet or you connected to the indexer with the same ethereum address somewhere else.',
        )
        console.log('attempting reconnect in 10s')
        setTimeout(() => {
          this.connect()
        }, 10000)
      }
    }

    // There was an error on the connection
    this.socket.onerror = event => {
      throw new Error(event)
    }

    // Promisify the `onmessage` handler. Allows us to return information
    // about the connection state after the authentication handshake
    return new Promise((resolve, reject) => {
      // Received a message
      this.socket.onmessage = event => {
        // We are authenticating
        if (!this.isAuthenticated) {
          switch (event.data) {
            // We have completed the challenge.
            case 'ok':
              this.isAuthenticated = true
              console.log('Working...')
              resolve(event.data)
              break
            case 'not authorized':
              reject(new Error('Address is not authorized.'))
              break
            default:
              // We have been issued a challenge.
              this.wallet.signMessage(event.data).then(signature => {
                this.socket.send(signature)
              })
          }
        } else if (this.isAuthenticated) {
          // We are already authenticated and are receiving an RPC.
          let payload
          let message

          try {
            payload = JSON.parse(event.data)
            message = payload.message && JSON.parse(payload.message)
          } catch (e) {
            console.error('Error parsing payload', e, payload)
          }

          if (!payload || !message) {
            return
          }

          if (message.method) {
            // Another peer is invoking a method.
            if (this.RPC_METHOD_ACTIONS[message.method]) {
              this.RPC_METHOD_ACTIONS[message.method](message)
            }
          } else if (message.id) {
            // We have received a response from a method call.
            const isError = Object.prototype.hasOwnProperty.call(message, 'error')

            if (!isError && message.result) {
              // Resolve the call if a resolver exists.
              if (typeof this.RESOLVERS[message.id] === 'function') {
                this.RESOLVERS[message.id](message.result)
              }
            } else if (isError) {
              // Reject the call if a resolver exists.
              if (typeof this.REJECTORS[message.id] === 'function') {
                this.REJECTORS[message.id](message.error)
              }
            }

            // Call lifecycle finished; tear down resolver, rejector, and timeout
            delete this.RESOLVERS[message.id]
            delete this.REJECTORS[message.id]
            clearTimeout(this.TIMEOUTS[message.id])
          }
        }
      }
    })
  }

  // Disconnect from AirSwap by closing websocket
  disconnect() {
    if (this.socket) this.socket.close(1000)
  }

  // Interacting with the Indexer
  // ----------------

  // Query the indexer for trade intents.
  // * returns a `Promise` which is resolved with an array of `intents`
  findIntents(makerTokens, takerTokens, role = 'maker') {
    if (!makerTokens || !takerTokens) {
      throw new Error('missing arguments makerTokens or takerTokens')
    }
    const payload = AirSwap.makeRPC('findIntents', {
      makerTokens,
      takerTokens,
      role,
    })

    return new Promise((resolve, reject) => this.call(INDEXER_ADDRESS, payload, resolve, reject))
  }

  // Make a JSON-RPC `getOrder` call on a maker and recieve back a signed order (or a timeout if they fail to respond)
  // * `makerAddress`: `string` - the maker address to request an order from
  // * `params`: `Object` - order parameters. Must specify 1 of either `makerAmount` or `takerAmount`. Must also specify `makerToken` and `takerToken` addresses
  getOrder(makerAddress, params) {
    const { makerAmount, takerAmount, makerToken, takerToken } = params
    const BadArgumentsError = new Error('bad arguments passed to getOrder')

    if (!makerAmount && !takerAmount) throw BadArgumentsError
    if (makerAmount && takerAmount) throw BadArgumentsError
    if (!takerToken || !makerToken) throw BadArgumentsError

    const payload = AirSwap.makeRPC('getOrder', {
      makerToken,
      takerToken,
      takerAddress: this.wallet.address.toLowerCase(),
      makerAmount: makerAmount ? String(makerAmount) : null,
      takerAmount: takerAmount ? String(takerAmount) : null,
    })
    return new Promise((res, rej) => this.call(makerAddress, payload, res, rej))
  }

  // Given an array of trade intents, make a JSON-RPC `getOrder` call for each `intent`
  getOrders(intents, makerAmount, takerAmount) {
    if (!Array.isArray(intents) || (!makerAmount && !takerAmount)) {
      throw new Error(
        'bad arguments passed to getOrders; must pass array of intents and 1 of either makerAmount or takerAmount',
      )
    }
    return Promise.all(
      intents.map(({ address, makerToken, takerToken }) => {
        const params = {
          makerToken,
          takerToken,
          takerAddress: this.wallet.address.toLowerCase(),
        }
        if (makerAmount) {
          params.makerAmount = String(makerAmount)
        } else if (takerAmount) {
          params.takerAmount = String(takerAmount)
        }
        const payload = AirSwap.makeRPC('getOrder', params)
        // `Promise.all` will return a complete array of resolved promises, or just the first rejection if a promise fails.
        // To mitigate this, we `catch` errors on individual promises so that `Promise.all` always returns a complete array
        return new Promise((res, rej) => this.call(address, payload, res, rej)).catch(e => e)
      }),
    )
  }
}
