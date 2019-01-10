const rp = require('request-promise')
const { KYBER_URL } = require('../constants.js')

module.exports = class Kyber {
  constructor() {
    this.sellRateUrl = `${KYBER_URL}/sell_rate`
    this.buyRateUrl = `${KYBER_URL}/buy_rate`
    this.currenciesUrl = `${KYBER_URL}/currencies`
    this.name = 'Kyber'
  }

  // fetch all supported tokens traded on kyber
  async getCurrencies() {
    const config = {
      uri: this.currenciesUrl,
      method: 'GET',
      json: true,
    }
    const currenciesResponse = await rp(config)
    const { error, data } = currenciesResponse
    if (error !== false || !data) {
      throw new Error(`error fetching data from ${this.name}: ${error}`)
    } else {
      return data
    }
  }

  async getBuyRate(id, desiredAmount) {
    const config = {
      uri: `${this.buyRateUrl}?id=${id}&qty=${desiredAmount}`,
      method: 'GET',
      json: true,
    }
    const buyRateResponse = await rp(config)
    const { error, data } = buyRateResponse
    if (error !== false || !data) {
      throw new Error(`error fetching buy rate from ${this.name}: ${error}`)
    } else {
      return data
    }
  }

  async getSellRate(id, desiredAmount) {
    const config = {
      uri: `${this.sellRateUrl}?id=${id}&qty=${desiredAmount}`,
      method: 'GET',
      json: true,
    }
    const sellRateResponse = await rp(config)
    const { error, data } = sellRateResponse
    if (error !== false || !data) {
      throw new Error(`error fetching sell rate from ${this.name}: ${error}`)
    } else {
      return data
    }
  }

  // compute the average token price based on DEX liquidity and desired token amount
  async computePrice(symbol, desiredAmount, isSell) {
    let result = {}
    try {
      const currencies = await this.getCurrencies()
      const tokenObj = currencies.find(token => token.symbol === symbol)

      if (!tokenObj) {
        throw new Error(`${symbol} is not available on ${this.name}`)
      }

      const [rate] = isSell
        ? await this.getSellRate(tokenObj.id, desiredAmount)
        : await this.getBuyRate(tokenObj.id, desiredAmount)
      const { src_qty, dst_qty } = rate // eslint-disable-line camelcase
      const [sourceQuantity] = src_qty // eslint-disable-line camelcase
      const [destinationQuantity] = dst_qty // eslint-disable-line camelcase
      const avgPrice = isSell ? destinationQuantity / sourceQuantity : sourceQuantity / destinationQuantity

      result = {
        exchangeName: this.name,
        totalPrice: isSell ? destinationQuantity : sourceQuantity,
        tokenAmount: isSell ? sourceQuantity : destinationQuantity,
        tokenSymbol: symbol,
        avgPrice,
        timestamp: Date.now(),
        error: null,
      }
    } catch (e) {
      result = {
        exchangeName: this.name,
        timestamp: Date.now(),
        error: e.message,
      }
    }
    return { [this.name]: result }
  }
}
