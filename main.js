const IDEX = require('./exchanges/IDEX.js')
const Kyber = require('./exchanges/Kyber.js')

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

// given a token symbol and amount, return offers from all dexes
// sorted descending by best price
function main(symbol, amount) {
  const dexes = [new IDEX(), new Kyber()]
  const promises = []

  dexes.forEach(dex => {
    promises.push(dex.computePrice(symbol, amount))
  })
  Promise.all(promises).then(results => {
    console.log(results)
  })
}

main('OMG', 500)

// const options = {
//   uri: `${PARADEX_URL}/ticker?market=weth-dai`,
//   method: 'POST',
//   headers: { 'Content-Type': 'application/json' },
//   json: true, // Automatically parses the JSON string in the response
// }

// rp(options).then(res => console.log(res))
