const rp = require('request-promise')
const { utils } = require('ethers')

const { BANCOR_URL } = require('../constants.js')

const USER_DECIMALS = process.argv[4]

module.exports = class Bancor {
  constructor() {
    this.pairsUrl = `${BANCOR_URL}/currencies/convertiblePairs`
    this.priceUrl = `${BANCOR_URL}/currencies`
    this.tokenDataUrl = `${BANCOR_URL}/currencies/tokens?limit=100&skip=0&fromCurrencyCode=ETH&includeTotal=true&orderBy=liquidityDepth&sortOrder=desc`
    this.name = 'Bancor'
  }

  // get token data so we can lookup unique token IDs
  async getAllTokenData() {
    const config = {
      uri: this.tokenDataUrl,
      method: 'GET',
      json: true,
    }
    const tokenDataResponse = await rp(config)
    const {
      data: {
        currencies: { page },
      },
    } = tokenDataResponse
    return page
  }

  // fetch all supported tokens traded on Bancor
  async getCurrencies() {
    const config = {
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
    if (USER_DECIMALS === '0') {
      decimalAdjustedAmount = desiredAmount
    } else {
      decimalAdjustedAmount = utils.parseUnits(String(desiredAmount), USER_DECIMALS)
    }

    const config = {
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
      if (USER_DECIMALS === '0') {
        return data
      }
      return utils.formatUnits(data, USER_DECIMALS)
    }
  }

  // compute the average token price based on DEX liquidity and desired token amount
  async computePrice(symbol, desiredAmount) {
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

      const tokenId = tokenObj._id
      const totalPrice = await this.getBuyRate(tokenId, desiredAmount)
      const avgPrice = totalPrice / desiredAmount

      result = {
        totalPrice: parseFloat(totalPrice),
        tokenAmount: parseFloat(desiredAmount),
        tokenSymbol: symbol,
        avgPrice,
      }
    } catch (e) {
      result = e
    }
    return { [this.name]: result }
  }
}
