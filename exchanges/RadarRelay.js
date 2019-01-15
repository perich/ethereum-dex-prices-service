const rp = require('request-promise')
const { RADAR_RELAY_URL } = require('../constants.js')
const OrderBookExchange = require('./OrderBookExchange.js')

module.exports = class RadarRelay extends OrderBookExchange {
  constructor() {
    super()
    this.marketsUrl = `${RADAR_RELAY_URL}/markets`
    this.name = 'Radar Relay'
  }

  getAvailableMarkets() {
    const config = {
      timeout: 3000,
      uri: this.marketsUrl,
      method: 'GET',
      json: true,
    }

    return rp(config)
  }

  // fetch the raw order book from the exchange
  _getRawOrderBook(symbol) {
    const marketId = symbol === 'DAI' ? 'WETH-DAI' : `${symbol}-WETH`
    const config = {
      timeout: 3000,
      uri: `${this.marketsUrl}/${marketId.toLowerCase()}/book`,
      method: 'GET',
      json: true,
    }

    return rp(config)
  }

  // invert the orderbook so that the quote asset becomes the base asset and visa versa
  // e.g. convert an ETH/DAI book to a DAI/ETH book
  static _flipBook(book) {
    const { asks, bids } = book
    const flipLevel = level => {
      const flippedPrice = 1 / parseFloat(level.price)
      const flippedAmount = level.remainingQuoteTokenAmount
      level.price = flippedPrice // eslint-disable-line no-param-reassign
      level.remainingBaseTokenAmount = flippedAmount // eslint-disable-line no-param-reassign
      return level
    }
    const flippedAsks = asks.map(flipLevel)
    const flippedBids = bids.map(flipLevel)
    book.asks = flippedBids // eslint-disable-line no-param-reassign
    book.bids = flippedAsks // eslint-disable-line no-param-reassign

    return book
  }

  // create an order book that conforms to the generalized order book interface
  async _createCanonicalOrderBook(symbol) {
    let lotPrice = 0
    let lotAmount = 0

    return new Promise(async resolve => {
      try {
        const availableMarkets = await this.getAvailableMarkets()
        const marketId = symbol === 'DAI' ? 'WETH-DAI' : `${symbol}-WETH`
        const isTokenAvailable = !!availableMarkets.find(market => market.id === marketId)
        if (!isTokenAvailable) {
          throw new Error(`${marketId} is not available on ${this.name}`)
        }
        const book = await this._getRawOrderBook(symbol)
        const { asks, bids } = symbol === 'DAI' ? RadarRelay._flipBook(book) : book

        const formattedAsks = asks.map(walkBook)

        lotPrice = 0
        lotAmount = 0

        const formattedBids = bids.map(walkBook)

        resolve({ asks: formattedAsks, bids: formattedBids })
      } catch (error) {
        resolve(null)
      }
    })

    function walkBook(level) {
      const levelPrice = parseFloat(level.price)
      const levelAmount = parseFloat(level.remainingBaseTokenAmount)

      lotAmount += levelAmount
      lotPrice += levelPrice * levelAmount

      return {
        levelPrice,
        levelAmount,
        lotPrice,
        lotAmount,
      }
    }
  }
}
