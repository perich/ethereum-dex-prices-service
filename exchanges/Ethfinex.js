const rp = require('request-promise')
const { ETHFINEX_URL } = require('../constants.js')
const OrderBookExchange = require('./OrderBookExchange.js')

module.exports = class Ethfinex extends OrderBookExchange {

  constructor() {
    super()
    
    this.marketsUrl = `${ETHFINEX_URL}/symbols`
    this.orderbookUrl = `${ETHFINEX_URL}/book`
    this.name = 'Ethfinex'
  }

  /**
   * Generates the ETH market ID for the given symbol.
   * Example: zrxeth
   * @param {string} symbol the symbol for which to create the ETH market ID
   */
  generateEthMarketId(symbol) {
    return symbol.toLowerCase() + 'eth'
  }

  /**
   * Retrieve the available markets for Ethfinex.
   * 
   * Example:
   * <pre><code>
   * [
   *   "btcusd",
   *   "ltcusd",
   *   "ltcbtc",
   *   ...
   * ]
   * </code></pre>
   */
  getAvailableMarkets() {
    const config = {
      timeout: 3000,
      uri: this.marketsUrl,
      method: 'GET',
      json: true,
    }

    return rp(config)
  }

  _getRawOrderBook(symbol) {
    let uri = `${this.orderbookUrl}/${this.generateEthMarketId(symbol)}`

    const config = {
      timeout: 3000,
      uri,
      method: 'GET',
      json: true,
    }

    return rp(config)
  }
  
  /**
   * Create an order book that conforms to the generalized order book interface.
   * 
   * Example:
   * <pre><code>
   * {
   *   asks: [
   *     { amount: '100', price: '0.005', lotAmount: '100', lotPrice: '0.5' },
   *     { amount: '200', price: '0.006', lotAmount: '300', lotPrice: '1.7' },
   *     { amount: '300', price: '0.007', lotAmount: '600', lotPrice: '3.8' },
   *   ],
   *   bids: [
   *     { amount: '100', price: '0.004', lotAmount: '100', lotPrice: '0.4' },
   *     { amount: '200', price: '0.003', lotAmount: '300', lotPrice: '1.0' },
   *     { amount: '300', price: '0.002', lotAmount: '600', lotPrice: '1.6' },
   *   ],
   * }
   * </code></pre>
   * @param {string} symbol the symbol for which to generate an ETH orderbook
   */
  async _createCanonicalOrderBook(symbol) {
    let lotPrice = 0
    let lotAmount = 0

    return new Promise(async resolve => {
      try {
        const availableMarkets = await this.getAvailableMarkets()
        const marketId = this.generateEthMarketId(symbol)
        
        const isTokenAvailable = !!availableMarkets.find(market => market === marketId)
        if (!isTokenAvailable) {
          throw new Error(`${symbol} is not available on ${this.name}`)
        }
        
        const book = await this._getRawOrderBook(symbol)
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
}