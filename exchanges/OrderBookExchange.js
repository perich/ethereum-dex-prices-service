/* eslint-disable class-methods-use-this */

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
  async computePrice(symbol, desiredAmount, isSell) {
    const book = await this._createCanonicalOrderBook(symbol)
    let result = {}
    if (book === '_createCanonicalOrderBook not implemented') {
      result = `The method _createCanonicalOrderBook must be implemented in the ${this.name} class`
    } else if (!book) {
      result = `no price data found on ${this.name} for ${symbol}`
    } else if (isSell) {
      const { bids } = book
      let avgPrice = 0
      let totalPrice
      for (let i = 0; i < bids.length; i += 1) {
        const bid = bids[i]
        const prevBid = bids[i - 1]

        if (desiredAmount > bid.lotAmount) {
          continue
        }

        if (i === 0) {
          avgPrice = bid.levelPrice
          totalPrice = bid.levelPrice * desiredAmount
          break
        }
        const remainder = desiredAmount - prevBid.lotAmount
        totalPrice = prevBid.lotPrice + remainder * bid.levelPrice
        avgPrice = totalPrice / desiredAmount
        break
      }

      // book didn't have enough liquidity for this size order
      if (avgPrice === 0) {
        result = `not enough liquidity on ${this.name} for ${desiredAmount} ${symbol}`
      } else {
        result = {
          totalPrice,
          tokenAmount: desiredAmount,
          tokenSymbol: symbol,
          avgPrice,
        }
      }
    } else {
      // it's a buy
      const { asks } = book
      let avgPrice = 0
      let totalPrice
      for (let i = 0; i < asks.length; i += 1) {
        const ask = asks[i]
        const prevAsk = asks[i - 1]

        if (desiredAmount > ask.lotAmount) {
          continue
        }

        if (i === 0) {
          avgPrice = ask.levelPrice
          totalPrice = ask.levelPrice * desiredAmount
          break
        }
        const remainder = desiredAmount - prevAsk.lotAmount
        totalPrice = prevAsk.lotPrice + remainder * ask.levelPrice
        avgPrice = totalPrice / desiredAmount
        break
      }

      // book didn't have enough liquidity for this size order
      if (avgPrice === 0) {
        result = `not enough liquidity on ${this.name} for ${desiredAmount} ${symbol}`
      } else {
        result = {
          totalPrice,
          tokenAmount: desiredAmount,
          tokenSymbol: symbol,
          avgPrice,
        }
      }
    }

    return { [this.name]: result }
  }
}
