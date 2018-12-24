const rp = require('request-promise')
const { PARADEX_URL, IDEX_URL } = require('./constants.js')

// canonical order book interface
const exampleBook = {
  // lowest ask first
  asks: [
    { amount: '100', price: '0.005', lotAmount: '100', lotPrice: '0.5' },
    { amount: '200', price: '0.006', lotAmount: '300', lotPrice: '1.7' },
    { amount: '300', price: '0.007', lotAmount: '600', lotPrice: '3.8' },
  ],
  // highest bid first
  bids: [
    { amount: '100', price: '0.004', lotAmount: '100', lotPrice: '0.4' },
    { amount: '200', price: '0.003', lotAmount: '300', lotPrice: '1.0' },
    { amount: '300', price: '0.002', lotAmount: '600', lotPrice: '1.6' },
  ],
}

class IDEX {
  constructor() {
    this.url = `${IDEX_URL}/returnOrderBook`
    this.name = 'IDEX'
  }

  // fetch the raw order book from the exchange
  getRawOrderBook(symbol) {
    const body = {
      market: `ETH_${symbol}`,
      count: 50,
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
    function walkBook(level) {
      const levelPrice = parseFloat(level.price)
      const levelAmount = parseFloat(level.amount)

      lotAmount += levelAmount
      lotPrice += levelPrice * levelAmount

      const avgUnitPrice = lotPrice / lotAmount
      return {
        levelPrice,
        levelAmount,
        lotPrice,
        lotAmount,
      }
    }

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
  }

  // compute the average token price based on DEX liquidity and desired token amount
  async computePrice(symbol, desiredAmount) {
    const book = await this.createCanonicalOrderBook(symbol)

    if (!book) {
      return {
        [this.name]: new Error(
          `no price data found on ${this.name} for ${symbol}`,
        ),
      }
    } else {
      const { asks } = book
      let avgPrice = 0

      for (let i = 0; i < asks.length; i++) {
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
        const totalPrice = prevAsk.lotPrice + remainder * ask.levelPrice
        avgPrice = totalPrice / desiredAmount
        break
      }

      const response = {
        amount: desiredAmount,
        symbol,
        avgPrice,
      }
      return { [this.name]: response }
    }
  }
}

// given a token symbol and amount, return offers from all dexes
// sorted descending by best price
function main(symbol, amount) {
  const dexes = [new IDEX()]
  const promises = []

  dexes.forEach(dex => {
    promises.push(dex.computePrice(symbol, amount))
  })

  Promise.all(promises).then(results => {
    console.log(results[0])
  })
}

main('AURA', 10000)

// const options = {
//   uri: `${PARADEX_URL}/ticker?market=weth-dai`,
//   method: 'POST',
//   headers: { 'Content-Type': 'application/json' },
//   json: true, // Automatically parses the JSON string in the response
// }

// rp(options).then(res => console.log(res))
