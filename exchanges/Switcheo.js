const rp = require('request-promise')
const { SWITCHEO_URL } = require('../constants.js')
const OrderBookExchange = require('./OrderBookExchange.js')

module.exports = class Switcheo extends OrderBookExchange {
  constructor() {
    super()
    this.url = `${SWITCHEO_URL}/v2/offers/book`
    this.name = 'Switcheo'
  }

  // fetch the raw order book from the exchange
  _getRawOrderBook(symbol) {
    let uri = `${this.url}/?pair=${symbol}_ETH`
    if (shouldFlip(symbol)) {
      uri = `${this.url}/?pair=ETH_${symbol}`
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
        const book = await this._getRawOrderBook(symbol)

        book.asks = book.asks.map(parseBook)
        book.bids = book.bids.map(parseBook)

        const { asks, bids } = shouldFlip(symbol) ? Switcheo._flipBook(book) : book

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

    // changes 'quantity' to 'amount' in the order book to be compatible
    function parseBook(level) {
      return {
        price: level.price,
        amount: level.quantity,
      }
    }
  }
}

// returns true if the symbol is the one being traded against.
// e.g. ETH_DAI, trading ETH against DAI.
function shouldFlip(symbol) {
  return symbol === 'DAI' || symbol === 'PAX'
}
