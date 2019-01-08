const { main } = require('./main')
const { TOP_TOKENS_DECIMAL_MAP } = require('./constants')

const makeResponse = (response, origin = null) => ({
  statusCode: 200,
  body: JSON.stringify(response),
  headers: {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Credentials': true,
    'Content-Type': 'application/json',
    'Cache-Control': 'max-age=0',
  },
})

module.exports = {
  hello: (event, context, callback) => {
    console.log('-----------------------')
    console.log(event)
    console.log('-----------------------')
    console.log(context)
    console.log('-----------------------')

    callback(null, makeResponse('hello world'))
  },
  buy: (event, context, callback) => {
    try {
      const { queryStringParameters } = event
      if (!queryStringParameters) throw new Error('must include query strings')
      const { amount, symbol, decimals } = queryStringParameters
      if (!amount || !symbol) throw new Error('must include "amount" and "symbol" parameters')

      main(symbol, amount, 'BUY', decimals || null).then(sortedResponses => {
        callback(null, makeResponse(sortedResponses))
      })
    } catch (error) {
      callback(error, null)
    }
  },
  sell: (event, context, callback) => {
    try {
      const { queryStringParameters } = event
      if (!queryStringParameters) throw new Error('must include query strings')
      const { amount, symbol, decimals } = queryStringParameters
      if (!amount || !symbol) throw new Error('must include "amount" and "symbol" parameters')

      main(symbol, amount, 'SELL', decimals || null).then(sortedResponses => {
        callback(null, makeResponse(sortedResponses))
      })
    } catch (error) {
      callback(error, null)
    }
  },
  buyPriceSnapshot: async (event, context, callback) => {
    const results = {}
    Object.keys(TOP_TOKENS_DECIMAL_MAP).forEach(symbol => {
      results[symbol] = {}
    })

    const doWorkForPriceLevel = priceLevel => {
      const tokens = [...Object.entries(TOP_TOKENS_DECIMAL_MAP)]
      return new Promise(resolve => {
        async function workLoop(level) {
          const tuple = tokens.pop()
          if (!tuple) {
            resolve(results)
            return
          }
          console.log(tokens.length)
          const [token, data] = tuple
          try {
            const sortedResponses = await main(token, data.levels[level], 'BUY', data.decimals)
            results[token][data.levels[level]] = sortedResponses
          } catch (error) {
            results[token][data.levels[level]] = error
          }

          // sleep for 3s to avoid api rate limits
          setTimeout(() => {
            workLoop(level)
          }, 3000)
        }
        workLoop(priceLevel)
      })
    }

    // don't use Promise.all.. we don't want these to run concurrently
    // calls are intentionally staggered to avoid API rate limits
    await doWorkForPriceLevel(0)
    await doWorkForPriceLevel(1)
    await doWorkForPriceLevel(2)
    return results
  },
}

const obj = {
  0: { BNB: [], AST: [] },
}
