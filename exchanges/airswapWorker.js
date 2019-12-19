// const { trackIndexSetLocator } = require('airswap.js/src/index/eventListeners.js')
// const { INDEXER_CONTRACT_DEPLOY_BLOCK } = require('airswap.js/src/constants.js')
const Indexer = require('airswap.js/src/indexer/index')
const Router = require('airswap.js/src/protocolMessaging/index.js')
const ethers = require('ethers')

const indexer = new Indexer()

// function noop() {}

// function parseEvents(events) {
//   process.send(events)
// }

// trackIndexSetLocator({
//   fromBlock: INDEXER_CONTRACT_DEPLOY_BLOCK,
//   onFetchedHistoricalEvents: parseEvents,
//   callback: noop,
// })

let message

process.on('message', msg => {
  message = msg
})

indexer.ready.then(async () => {
  const router = new Router({ requireAuthentication: false, address: ethers.Wallet.createRandom().address })
  try {
    const intents = await indexer.getIntents()
    const { method, senderToken, signerToken, senderParam, signerParam } = message
    const filteredIntents = intents.filter(intent => {
      if (
        intent.signerToken === signerToken.toLowerCase() && // eslint-disable-line
        intent.senderToken === senderToken.toLowerCase() && // eslint-disable-line
        intent.locatorType === 'https'
      ) {
        return true
      }
      return false
    })

    if (method === 'getSenderSideQuotes') {
      const quotePromises = filteredIntents.map(intent => {
        const params = {
          signerToken,
          senderToken,
          signerParam,
          locator: intent.locator,
          locatorType: intent.locatorType,
        }
        return router.getSenderSideQuote(intent.identifier, params)
      })

      const quotes = await Promise.all(quotePromises)
      process.send(quotes)
    }

    if (method === 'getSignerSideQuotes') {
      const quotePromises = filteredIntents.map(intent => {
        const params = {
          signerToken,
          senderToken,
          senderParam,
          locator: intent.locator,
          locatorType: intent.locatorType,
        }
        return router.getSignerSideQuote(intent.identifier, params)
      })
      const quotes = await Promise.all(quotePromises)
      process.send(quotes)
    }
  } catch (error) {
    process.send(error)
  }
})
