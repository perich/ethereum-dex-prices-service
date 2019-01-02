const IDEX = require('./exchanges/IDEX.js')
const DDEX = require('./exchanges/DDEX.js')
const Kyber = require('./exchanges/Kyber.js')
const Bancor = require('./exchanges/Bancor.js')
const AirSwap = require('./exchanges/AirSwap.js')

const USER_AMOUNT = process.argv[2]
const USER_SYMBOL = process.argv[3]
// optionally specify token decimals to enable Bancor support
const USER_DECIMALS = process.argv[4]

if (!USER_AMOUNT || !USER_SYMBOL) {
  throw new Error('must specify amount and token in CLI arguments')
}

// given a token symbol and amount, return offers from all dexes
// sorted descending by best price
function main(symbol, amount) {
  const dexes = [new IDEX(), new DDEX(), new Kyber(), new AirSwap()]
  // Bancor requires users to specify token decimals to use the API
  if (USER_DECIMALS) {
    dexes.push(new Bancor())
  }
  const promises = []

  dexes.forEach(dex => {
    promises.push(dex.computePrice(symbol, amount))
  })
  Promise.all(promises).then(results => {
    const sortedResults = results.sort((a, b) => {
      const [aData] = Object.values(a)
      const [bData] = Object.values(b)

      if (aData.totalPrice && !bData.totalPrice) return -1
      if (!aData.totalPrice && bData.totalPrice) return 1
      if (aData.totalPrice && bData.totalPrice) {
        if (aData.totalPrice > bData.totalPrice) return 1
        if (aData.totalPrice < bData.totalPrice) return -1
      }
      return 0
    })
    const bestPriceDex = sortedResults[0]
    const [bestDexName, bestDexData] = Object.entries(bestPriceDex)[0]
    if (bestDexData.totalPrice) {
      console.log('✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨')
      console.log(`You can find the best price on ${bestDexName}! (${bestDexData.avgPrice} ${symbol}/ETH)`)
      console.log('✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨')
    } else {
      console.log('No good orders found! 😢')
    }
    console.log(sortedResults)
  })
}

main(USER_SYMBOL, parseFloat(USER_AMOUNT))
