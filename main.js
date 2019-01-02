const IDEX = require('./exchanges/IDEX.js')
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
  const dexes = [new IDEX(), new Kyber(), new AirSwap()]
  if (USER_DECIMALS) {
    dexes.push(new Bancor())
  }
  const promises = []

  dexes.forEach(dex => {
    promises.push(dex.computePrice(symbol, amount))
  })
  Promise.all(promises).then(results => {
    console.log(results)
  })
}

main(USER_SYMBOL, USER_AMOUNT)
