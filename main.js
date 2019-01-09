const IDEX = require('./exchanges/IDEX.js')
const DDEX = require('./exchanges/DDEX.js')
const Kyber = require('./exchanges/Kyber.js')
const Bancor = require('./exchanges/Bancor.js')
const AirSwap = require('./exchanges/AirSwap.js')
const RadarRelay = require('./exchanges/RadarRelay.js')
const { sortBids, sortAsks } = require('./helpers')

// given a token symbol and amount, return offers from all dexes
// sorted descending by best price
module.exports = {
  main(symbol, amount, direction, decimals) {
    if (direction !== 'BUY' && direction !== 'SELL') {
      throw new Error(`must specify BUY or SELL. you specified "${direction}"`)
    }
    const dexes = [new IDEX(), new DDEX(), new Kyber(), new AirSwap(), new RadarRelay(), new Bancor(decimals)]
    const promises = dexes.map(dex => dex.computePrice(symbol, amount, direction === 'SELL'))

    return Promise.all(promises).then(results => {
      const sortedResults = direction === 'BUY' ? results.sort(sortAsks) : results.sort(sortBids)

      return sortedResults
    })
  },
}
