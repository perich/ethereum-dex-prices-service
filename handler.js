const { main } = require('./main')

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
}
