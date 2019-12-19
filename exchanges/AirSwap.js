const wtf = require('wtfnode')
const rp = require('request-promise')
const cp = require('child_process')
const path = require('path')
const ethers = require('ethers')
// const uuid = require('uuid4')
const Router = require('airswap.js/src/protocolMessaging/index.js')
const { AIRSWAP_TOKEN_METADATA_URL } = require('../constants.js')

const { utils } = ethers
// const TIMEOUT = 6000
// const INDEXER_ADDRESS = '0x0000000000000000000000000000000000000000'

module.exports = class AirSwap {
  constructor() {
    this.name = 'AirSwap'
    this.wallet = ethers.Wallet.createRandom()
    this.metadataUrl = `${AIRSWAP_TOKEN_METADATA_URL}/tokens`
  }

  getTokenMetadata() {
    const config = {
      uri: this.metadataUrl,
      method: 'GET',
      json: true,
    }
    return rp(config)
  }

  fetchIndexerIntents(method, { senderToken, signerToken, signerParam, senderParam }) {
    if (!senderToken || !signerToken) {
      throw new Error('Must specify senderToken and signerToken')
    }
    // airswap.js kicks off some event polling processes when we execute the worker
    // it's spawned in a child process so that it doesn't stop the parent process from terminating
    const child = cp.fork(path.join(__dirname, './airswapWorker.js'), [])
    this.child = child
    child.send({ method, senderToken, signerToken, signerParam, senderParam })
    return new Promise(resolve => {
      child.on('message', data => {
        // console.log('got quotes', data)
        child.kill('SIGKILL')
        resolve(data)
      })
    })
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

      const orders = isSell
        ? await this.fetchIndexerIntents('getSignerSideQuotes', {
            signerToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            senderToken: tokenObj.address,
            senderParam: decimalAdjustedAmount.toString(),
          })
        : await this.fetchIndexerIntents('getSenderSideQuotes', {
            signerToken: tokenObj.address,
            senderToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            signerParam: decimalAdjustedAmount.toString(),
          })

      if (!orders || !orders.length) throw noOrderError

      const [bestOrder] = orders.sort((a, b) => {
        if (a.maker.param && !b.maker.param) return -1
        if (b.maker.param && !a.maker.param) return 1
        if (a.maker.param && b.maker.param) {
          return parseInt(a.maker.param, 10) > parseInt(b.maker.param, 10) ? -1 : 1
        }
        return 0
      })

      console.log('bestOrder', bestOrder)
      if (!bestOrder.maker.param || !bestOrder.taker.param) {
        throw noOrderError
      }

      const formattedMakerAmount = isSell
        ? utils.formatUnits(bestOrder.maker.param, 18)
        : utils.formatUnits(bestOrder.maker.param, tokenDecimals)
      const formattedTakerAmount = isSell
        ? utils.formatUnits(bestOrder.taker.param, tokenDecimals)
        : utils.formatUnits(bestOrder.taker.param, 18)

      result = {
        exchangeName: this.name,
        totalPrice: parseFloat(isSell ? formattedMakerAmount : formattedTakerAmount),
        tokenAmount: parseFloat(isSell ? formattedTakerAmount : formattedMakerAmount),
        tokenSymbol: symbol,
        avgPrice: isSell ? formattedMakerAmount / formattedTakerAmount : formattedTakerAmount / formattedMakerAmount,
        timestamp: Date.now(),
        error: null,
      }
    } catch (e) {
      result = {
        exchangeName: this.name,
        timestamp: Date.now(),
        error: e.message,
        tokenSymbol: symbol,
        tokenAmount: desiredAmount,
      }
    }
    this.child.kill('SIGKILL')
    wtf.dump()
    return { [this.name]: result }
  }
}
