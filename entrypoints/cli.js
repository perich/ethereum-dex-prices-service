const { main } = require('../index')
const { pipeResultsToCommandLine } = require('../helpers')

// BUY or SELL
let USER_METHOD = process.argv[2]
// Amount of token to BUY or SELL
let USER_AMOUNT = process.argv[3]
// Token ticker symbol
let USER_SYMBOL = process.argv[4]
const USER_DECIMALS = process.argv[5]

if (!USER_METHOD || !USER_AMOUNT || !USER_SYMBOL) {
  throw new Error('must specify BUY/SELL, amount, and token in CLI arguments')
}

USER_METHOD = USER_METHOD.toUpperCase()
USER_SYMBOL = USER_SYMBOL.toUpperCase()
USER_AMOUNT = global.parseFloat(USER_AMOUNT)

main(USER_SYMBOL, USER_AMOUNT, USER_METHOD, USER_DECIMALS || null).then(sortedResults => {
  pipeResultsToCommandLine(sortedResults, USER_SYMBOL, USER_AMOUNT, USER_METHOD)
})
