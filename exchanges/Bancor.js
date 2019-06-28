const rp = require('request-promise')
const { utils } = require('ethers')

const { BANCOR_URL } = require('../constants.js')

module.exports = class Bancor {
  constructor(decimals = null) {
    this.tokenDecimals = decimals
    this.pairsUrl = `${BANCOR_URL}/currencies/convertiblePairs`
    this.priceUrl = `${BANCOR_URL}/currencies`
    this.converterInfoUrl = `${BANCOR_URL}/converters`
    this.tokenDataUrl = `${BANCOR_URL}/currencies/tokens?limit=100&skip=0&fromCurrencyCode=ETH&includeTotal=true&orderBy=liquidityDepth&sortOrder=desc`
    this.name = 'Bancor'
  }

  // get token data so we can lookup unique token IDs
  async getAllTokenData() {
    const config = {
      timeout: 3000,
      uri: this.tokenDataUrl,
      method: 'GET',
      json: true,
    }
    const tokenDataResponse = await rp(config)
    const {
      data: { page }
      } = tokenDataResponse
    return page
  }

  async getTokenDataForSymbol(symbol) {
    const config = {
      timeout: 3000,
      uri: `${this.converterInfoUrl}?code=${symbol}`,
      method: 'GET',
      json: true,
    }
    const tokenDataResponse = await rp(config)
    const {
      data: { page },
    } = tokenDataResponse
    return page[0]
  }

  // fetch all supported tokens traded on Bancor
  async getCurrencies() {
    const config = {
      timeout: 3000,
      uri: this.pairsUrl,
      method: 'GET',
      json: true,
    }
    const currenciesResponse = await rp(config)
    const { data } = currenciesResponse
    if (!data) {
      throw new Error(`error fetching data from ${this.name}`)
    } else {
      return data
    }
  }

  async getBuyRate(id, desiredAmount) {
    let decimalAdjustedAmount
    if (this.tokenDecimals === '0') {
      decimalAdjustedAmount = desiredAmount
    } else {
      decimalAdjustedAmount = utils.parseUnits(String(desiredAmount), this.tokenDecimals)
    }

    const config = {
      timeout: 3000,
      uri: `${
        this.priceUrl
      }/5937d635231e97001f744267/value?toCurrencyId=${id}&toAmount=${decimalAdjustedAmount.toString()}`,
      method: 'GET',
      json: true,
    }
    const buyRateResponse = await rp(config)
    const { data } = buyRateResponse
    if (!data) {
      throw new Error(`error fetching buy rate from ${this.name}`)
    } else {
      if (this.tokenDecimals === '0') {
        return data
      }
      return utils.formatUnits(data, this.tokenDecimals)
    }
  }

  async getSellRate(id, desiredAmount) {
    let decimalAdjustedAmount
    if (this.tokenDecimals === '0') {
      decimalAdjustedAmount = desiredAmount
    } else {
      decimalAdjustedAmount = utils.parseUnits(String(desiredAmount), this.tokenDecimals)
    }

    const config = {
      timeout: 3000,
      uri: `${
        this.priceUrl
      }/${id}/value?toCurrencyId=5937d635231e97001f744267&fromAmount=${decimalAdjustedAmount.toString()}`,
      method: 'GET',
      json: true,
    }
    const sellRateResponse = await rp(config)
    const { data } = sellRateResponse
    if (!data) {
      throw new Error(`error fetching buy rate from ${this.name} for asset ID ${id} at amount ${desiredAmount}`)
    } else {
      if (this.tokenDecimals === '0') {
        return data
      }
      return utils.formatUnits(data, this.tokenDecimals)
    }
  }

  // compute the average token price based on DEX liquidity and desired token amount
  async computePrice(symbol, desiredAmount, isSell) {
    let result = {}
    try {
      const currencies = await this.getCurrencies()
      const matchedSymbol = Object.keys(currencies).find(tickerSymbol => tickerSymbol === symbol)

      if (matchedSymbol === null) {
        throw new Error(`${symbol} is not available on ${this.name}`)
      }

      const tokenData = await this.getAllTokenData()
      const tokenObj = tokenData.find(token => token.code === symbol)
      if (!tokenObj) {
        throw new Error(`${symbol} is not available on ${this.name}`)
      }
      const tokenDetails = await this.getTokenDataForSymbol(symbol)
      this.tokenDecimals = String(tokenDetails.details[0].decimals)

      const tokenId = tokenObj.id
      const totalPrice = isSell
        ? await this.getSellRate(tokenId, desiredAmount)
        : await this.getBuyRate(tokenId, desiredAmount)
      const avgPrice = totalPrice / desiredAmount

      result = {
        exchangeName: this.name,
        totalPrice: parseFloat(totalPrice),
        tokenAmount: parseFloat(desiredAmount),
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
        tokenAmount: parseFloat(desiredAmount),
        tokenSymbol: symbol,
      }
    }
    return { [this.name]: result }
  }
}
