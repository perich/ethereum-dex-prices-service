const rp = require('request-promise')
const { IDEX_URL } = require('../constants.js')

module.exports = class IDEX {
  constructor() {
    this.url = `${IDEX_URL}/returnOrderBook`
    this.name = 'IDEX'
  }

  // fetch the raw order book from the exchange
  getRawOrderBook(symbol) {
    const body = {
      market: `ETH_${symbol}`,
      count: 100,
    }
    const config = {
      uri: this.url,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      json: true,
    }

    return rp(config)
  }

  // create an order book that conforms to the generalized order book interface
  async createCanonicalOrderBook(symbol) {
    let lotPrice = 0
    let lotAmount = 0

    return new Promise(async resolve => {
      try {
        const book = await this.getRawOrderBook(symbol)
        const { asks, bids } = book

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

  // compute the average token price based on DEX liquidity and desired token amount
  async computePrice(symbol, desiredAmount) {
    const book = await this.createCanonicalOrderBook(symbol)
    let result = {}
    if (!book) {
      result = {
        [this.name]: new Error(
          `no price data found on ${this.name} for ${symbol}`,
        ),
      }
    } else {
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
          break
        }
        const remainder = desiredAmount - prevAsk.lotAmount
        totalPrice = prevAsk.lotPrice + remainder * ask.levelPrice
        avgPrice = totalPrice / desiredAmount
        break
      }

      // book didn't have enough liquidity for this size order
      if (avgPrice === 0) {
        result = new Error(
          `not enough liquidity on ${this.name} for ${desiredAmount} ${symbol}`,
        )
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
