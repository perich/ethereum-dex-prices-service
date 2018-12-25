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
  async computePrice(symbol, desiredAmount) {
    let result = {}
    try {
      const currencies = await this.getCurrencies()
      const tokenObj = currencies.find(token => token.symbol === symbol)

      if (tokenObj === null) {
        throw new Error(`${symbol} is not available on ${this.name}`)
      }

      const [buyRate] = await this.getBuyRate(tokenObj.id, desiredAmount)
      const { src_qty, dst_qty } = buyRate
      const [sourceQuantity] = src_qty
      const [destinationQuantity] = dst_qty
      const avgPrice = sourceQuantity / destinationQuantity

      result = {
        lotPrice: sourceQuantity,
        amount: destinationQuantity,
        symbol,
        avgPrice,
      }
    } catch (e) {
      result = e
    }
    return { [this.name]: result }
  }
}
