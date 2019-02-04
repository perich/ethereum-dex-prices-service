const rp = require('request-promise')
const { SATURN_URL } = require('../constants.js')
const OrderBookExchange = require('./OrderBookExchange.js')

const etherAddress = '0x0000000000000000000000000000000000000000'

module.exports = class SaturnNetwork extends OrderBookExchange {
  constructor(chain = 'eth') {
    super()
    this.currenciesUrl = `${SATURN_URL}/dashboard/${chain}.json`
    this.chain = chain
    this.name = 'Saturn Network'
  }

  async _getCurrencies() {
    try {
      const config = {
        timeout: 5000,
        uri: this.currenciesUrl,
        method: 'GET',
        json: true,
      }
      const data = await rp(config)
      return data.sort((a, b) => parseFloat(b.token.liquidity_depth.ether) - parseFloat(a.token.liquidity_depth.ether))
    } catch (error) {
      throw new Error(`error fetching data from ${this.name}: ${error}`)
    }
  }

  async _getTokenAddress(symbol) {
    const allTokens = await this._getCurrencies()
    const tokenObj = allTokens.find(x => x.token.symbol === symbol)
    return tokenObj.token.address
  }

  async _getRawOrderBook(symbol) {
    try {
      const tokenAddress = await this._getTokenAddress(symbol)
      const url = `${SATURN_URL}/orders/${this.chain}/${tokenAddress}/${etherAddress}/all.json`
      const config = {
        timeout: 10000,
        uri: url,
        method: 'GET',
        json: true,
      }
      const data = await rp(config)
      return data
    } catch (error) {
      throw new Error(`error fetching sell rate from ${this.name}: ${error}`)
    }
  }

  // create an order book that conforms to the generalized order book interface
  async _createCanonicalOrderBook(symbol) {
    let lotPrice = 0
    let lotAmount = 0

    return new Promise(async resolve => {
      try {
        const book = await this._getRawOrderBook(symbol)
        const asks = book.buys.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
        const bids = book.sells.sort((a, b) => parseFloat(b.price) - parseFloat(a.price))

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
      const levelAmount = parseFloat(level.balance)

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
