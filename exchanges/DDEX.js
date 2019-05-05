const rp = require('request-promise')
const { DDEX_URL } = require('../constants.js')
const OrderBookExchange = require('./OrderBookExchange.js')

const flippableBooks = ['DAI', 'TUSD', 'USDC', 'USDT', 'PAX']

module.exports = class DDEX extends OrderBookExchange {
  constructor() {
    super()
    this.url = `${DDEX_URL}/markets`
    this.name = 'DDEX'
  }

  // fetch the raw order book from the exchange
  _getRawOrderBook(symbol) {
    let uri = `${this.url}/${symbol}-WETH/orderbook?level=2`
    if (flippableBooks.includes(symbol)) {
      uri = `${this.url}/WETH-${symbol}/orderbook?level=2`
    }
    const config = {
      timeout: 3000,
      uri,
      method: 'GET',
      json: true,
    }

    return rp(config)
  }

  // create an order book that conforms to the generalized order book interface
  async _createCanonicalOrderBook(symbol) {
    let lotPrice = 0
    let lotAmount = 0

    return new Promise(async resolve => {
      try {
        const {
          data: { orderBook },
        } = await this._getRawOrderBook(symbol)

        const { asks, bids } = flippableBooks.includes(symbol) ? DDEX._flipBook(orderBook) : orderBook

        if (!asks.length || !bids.length) {
          throw new Error()
        }

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
      const levelAmount = parseFloat(level.amount)

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
