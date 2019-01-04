const IDEX = require('./exchanges/IDEX.js')
const DDEX = require('./exchanges/DDEX.js')
const Kyber = require('./exchanges/Kyber.js')
const Bancor = require('./exchanges/Bancor.js')
const AirSwap = require('./exchanges/AirSwap.js')

// BUY or SELL
const USER_METHOD = process.argv[2]
// Amount of token to BUY or SELL
const USER_AMOUNT = process.argv[3]
// Token ticker symbol
const USER_SYMBOL = process.argv[4]
// optionally specify token decimals to enable Bancor support
const USER_DECIMALS = process.argv[5]

if (!USER_METHOD || !USER_AMOUNT || !USER_SYMBOL) {
  throw new Error('must specify BUY/SELL, amount, and token in CLI arguments')
}

// given a token symbol and amount, return offers from all dexes
// sorted descending by best price
function main(symbol, amount, direction) {
  if (direction !== 'BUY' && direction !== 'SELL') {
    throw new Error(`must specify BUY or SELL. you specified "${direction}"`)
  }
  const dexes = [new IDEX(), new DDEX(), new Kyber(), new AirSwap()]
  const promises = []
  // Bancor requires users to specify token decimals to use the API
  if (USER_DECIMALS) {
    dexes.push(new Bancor())
  }

  dexes.forEach(dex => {
    promises.push(dex.computePrice(symbol, amount, direction === 'SELL'))
  })

  Promise.all(promises).then(results => {
    const sortedResults = direction === 'BUY' ? results.sort(sortAsks) : results.sort(sortBids)
    const bestPriceDex = sortedResults[0]
    const [bestDexName, bestDexData] = Object.entries(bestPriceDex)[0]
    if (bestDexData.totalPrice) {
      console.log('✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨')
      console.log(
        '\x1b[32m%s\x1b[0m',
        `You can find the best price on ${bestDexName}! ${direction} ${amount} @ ${bestDexData.avgPrice} ${symbol}/ETH`,
      )
      console.log('✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨')
    } else {
      console.log('No good orders found! 😢')
    }
    console.log(sortedResults)

    function sortAsks(a, b) {
      const [aData] = Object.values(a)
      const [bData] = Object.values(b)

      if (aData.totalPrice && !bData.totalPrice) return -1
      if (!aData.totalPrice && bData.totalPrice) return 1
      if (aData.totalPrice && bData.totalPrice) {
        if (aData.totalPrice > bData.totalPrice) return 1
        if (aData.totalPrice < bData.totalPrice) return -1
      }
      return 0
    }

    function sortBids(a, b) {
      const [aData] = Object.values(a)
      const [bData] = Object.values(b)

      if (aData.totalPrice && !bData.totalPrice) return -1
      if (!aData.totalPrice && bData.totalPrice) return 1
      if (aData.totalPrice && bData.totalPrice) {
        if (aData.totalPrice > bData.totalPrice) return -1
        if (aData.totalPrice < bData.totalPrice) return 1
      }
      return 0
    }
  })
}

main(USER_SYMBOL.toUpperCase(), parseFloat(USER_AMOUNT), USER_METHOD.toUpperCase())
