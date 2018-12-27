const IDEX = require('./exchanges/IDEX.js')
const Kyber = require('./exchanges/Kyber.js')
const Bancor = require('./exchanges/Bancor.js')

const USER_AMOUNT = process.argv[2]
const USER_SYMBOL = process.argv[3]
// optionally specify token decimals to enable Bancor support
const USER_DECIMALS = process.argv[4]

if (!USER_AMOUNT || !USER_SYMBOL) {
  throw new Error('must specify amount and token in CLI arguments')
}

console.log(process.argv)

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
} */

// given a token symbol and amount, return offers from all dexes
// sorted descending by best price
function main(symbol, amount) {
  const dexes = [new IDEX(), new Kyber()]
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
