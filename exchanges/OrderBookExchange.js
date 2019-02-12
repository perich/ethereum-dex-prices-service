/* eslint-disable class-methods-use-this */
const { applyFeeToResult } = require('../helpers')

module.exports = class OrderBookExchange {
  async _createCanonicalOrderBook() {
    // implement exchange-specific logic here !

    /* canonical order book example

    const exampleBook = {
      asks: [
        { amount: '100', price: '0.005', lotAmount: '100', lotPrice: '0.5' },
        { amount: '200', price: '0.006', lotAmount: '300', lotPrice: '1.7' },
        { amount: '300', price: '0.007', lotAmount: '600', lotPrice: '3.8' },
      ],
      bids: [
        { amount: '100', price: '0.004', lotAmount: '100', lotPrice: '0.4' },
        { amount: '200', price: '0.003', lotAmount: '300', lotPrice: '1.0' },
        { amount: '300', price: '0.002', lotAmount: '600', lotPrice: '1.6' },
      ],
    }
    */
    return '_createCanonicalOrderBook not implemented'
  }

  // invert the orderbook so that the quote asset becomes the base asset and visa versa
  // e.g. convert an ETH/DAI book to a DAI/ETH book
  static _flipBook(book) {
    const { asks, bids } = book
    const flipLevel = level => {
      const flippedPrice = 1 / parseFloat(level.price)
      const flippedAmount = parseFloat(level.amount) / flippedPrice
      level.price = flippedPrice // eslint-disable-line no-param-reassign
      level.amount = flippedAmount // eslint-disable-line no-param-reassign
      return level
    }
    const flippedAsks = asks.map(flipLevel)
    const flippedBids = bids.map(flipLevel)
    book.asks = flippedBids // eslint-disable-line no-param-reassign
    book.bids = flippedAsks // eslint-disable-line no-param-reassign

    return book
  }

  // compute the average token price based on DEX liquidity and desired token amount
  async computePrice(symbol, desiredAmount, isSell, fee) {
    const book = await this._createCanonicalOrderBook(symbol)

    let result = {
      exchangeName: this.name,
      timestamp: Date.now(),
      tokenSymbol: symbol,
      tokenAmount: desiredAmount,
    }

    if (book === '_createCanonicalOrderBook not implemented') {
      result.error = `The method _createCanonicalOrderBook must be implemented in the ${this.name} class`
    } else if (!book) {
      result.error = `no price data found on ${this.name} for ${symbol}`
    } else {
      const { avgPrice, totalPrice } = isSell ? calculatePricing(book.bids) : calculatePricing(book.asks)

      // Check if the market is liquid enough
      if (avgPrice === 0) {
        result.error = `not enough liquidity on ${this.name} for ${desiredAmount} ${symbol}`
      } else {
        result = {
          exchangeName: this.name,
          totalPrice,
          tokenAmount: desiredAmount,
          tokenSymbol: symbol,
          avgPrice,
          timestamp: Date.now(),
          error: null,
        }
      }
    }
    if (fee !== 0) {
      result = applyFeeToResult(result, fee)
    }
    return { [this.name]: result }

    /**
     * Calculate the average and total price if the given amount were to be executed on the orderbook.
     * @param {*} orders the orders from the side of the book the order would be executed against
     */
    function calculatePricing(orders) {
      let avgPrice = 0
      let totalPrice
      for (let i = 0; i < orders.length; i += 1) {
        const order = orders[i]
        const previousOrder = orders[i - 1]

        if (desiredAmount > order.lotAmount) {
          continue
        }

        if (i === 0) {
          avgPrice = order.levelPrice
          totalPrice = order.levelPrice * desiredAmount
          break
        }
        const remainder = desiredAmount - previousOrder.lotAmount
        totalPrice = previousOrder.lotPrice + remainder * order.levelPrice
        avgPrice = totalPrice / desiredAmount
        break
      }

      return {
        avgPrice,
        totalPrice,
      }
    }
  }
}
