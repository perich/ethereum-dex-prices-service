const rp = require('request-promise')
const cp = require('child_process')
const path = require('path')
const ethers = require('ethers')
const { AIRSWAP_TOKEN_METADATA_URL } = require('../constants.js')

const { utils } = ethers

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

  static fetchIndexerIntents(method, { senderToken, signerToken, signerParam, senderParam }) {
    if (!senderToken || !signerToken) {
      throw new Error('Must specify senderToken and signerToken')
    }
    // airswap.js kicks off some event polling processes when we execute the worker
    // it's spawned in a child process so that it doesn't stop the parent process from terminating
    const child = cp.fork(path.join(__dirname, './airswapWorker.js'), [])
    child.send({ method, senderToken, signerToken, signerParam, senderParam })
    return new Promise(resolve => {
      child.on('message', data => {
        child.kill()
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
        ? await AirSwap.fetchIndexerIntents('getSignerSideQuotes', {
            signerToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            senderToken: tokenObj.address,
            senderParam: decimalAdjustedAmount.toString(),
          })
        : await AirSwap.fetchIndexerIntents('getSenderSideQuotes', {
            signerToken: tokenObj.address,
            senderToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            signerParam: decimalAdjustedAmount.toString(),
          })

      if (!orders || !orders.length) throw noOrderError
      console.log(orders)

      const [bestOrder] = orders.sort((a, b) => {
        if (!a && b) return 1
        if (a && !b) return -1
        if (!a && !b) return 0
        if (a.maker.amount && !b.maker.amount) return -1
        if (b.maker.amount && !a.maker.amount) return 1
        if (a.maker.amount && b.maker.amount) {
          return parseInt(a.maker.amount, 10) > parseInt(b.maker.amount, 10) ? -1 : 1
        }
        return 0
      })

      if (!bestOrder.maker.amount || !bestOrder.taker.amount) {
        throw noOrderError
      }

      const formattedMakerAmount = isSell
        ? utils.formatUnits(String(bestOrder.maker.amount), 18)
        : utils.formatUnits(String(bestOrder.maker.amount), tokenDecimals)
      const formattedTakerAmount = isSell
        ? utils.formatUnits(String(bestOrder.taker.amount), tokenDecimals)
        : utils.formatUnits(String(bestOrder.taker.amount), 18)

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

    return { [this.name]: result }
  }
}
