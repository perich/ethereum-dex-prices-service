const AirSwap = require('./exchanges/AirSwap.js')
const Bancor = require('./exchanges/Bancor.js')
const DDEX = require('./exchanges/DDEX.js')
const Ethfinex = require('./exchanges/Ethfinex.js')
const Forkdelta = require('./exchanges/Forkdelta.js')
const IDEX = require('./exchanges/IDEX.js')
const Kyber = require('./exchanges/Kyber.js')
const RadarRelay = require('./exchanges/RadarRelay.js')
const SaturnNetwork = require('./exchanges/Saturn.js')
const Uniswap = require('./exchanges/Uniswap.js')
const Switcheo = require('./exchanges/Switcheo.js')
const { sortBids, sortAsks } = require('./helpers')
const { DDEX_TAKER_FEE } = require('./constants')

// given a token symbol and amount, return offers from all dexes
// sorted descending by best price
module.exports = {
  main(symbol, amount, direction, decimals) {
    if (direction !== 'BUY' && direction !== 'SELL') {
      throw new Error(`must specify BUY or SELL. you specified "${direction}"`)
    }
    const dexes = [
      new AirSwap(),
      new Bancor(decimals),
      new DDEX(),
      new Ethfinex(),
      new Forkdelta(),
      new IDEX(),
      new Kyber(),
      new RadarRelay(),
      new SaturnNetwork('eth'),
      new Uniswap(),
      new Switcheo(),
    ]

    const promises = dexes.map(dex =>
      dex.computePrice(symbol, amount, direction === 'SELL', dex.name === 'DDEX' ? DDEX_TAKER_FEE : 0),
    )

    return Promise.all(promises).then(results => {
      const sortedResults = direction === 'BUY' ? results.sort(sortAsks) : results.sort(sortBids)

      return sortedResults
    })
  },
}
