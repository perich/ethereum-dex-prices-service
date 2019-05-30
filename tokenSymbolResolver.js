// service responsible for resolving symbols to ethereum addresses
const rp = require('request-promise')

const { COINGECKO_API_URL, AIRSWAP_TOKEN_METADATA_URL } = require('./constants.js')
const jsonTokensBySymbol = require('./tokensBySymbol.json')

// Returns a promise that will always resolve()
// will resolve with a string `tokenAddress` or `undefined`
// e.g. tokenSymbolResolver('DAI') -> "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359"
// tokenSymbolResolver('FizzBuzz') -> undefined
const tokenSymbolResolver = async symbol => {
  let tokenAddress = null
  try {
    // first, query coingecko api and try to resolve dynamically
    tokenAddress = await new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('5s timeout reached waiting for Coingecko API'))
      }, 5000)

      try {
        // get all tokens and find by relevant symbol
        const cgTokensList = JSON.parse(await rp(`${COINGECKO_API_URL}/coins/list`))
        const matchedTokenObj = cgTokensList.find(tokenObj => tokenObj.symbol.toUpperCase() === symbol.toUpperCase())
        if (!matchedTokenObj) throw new Error(`${symbol} not found in coingecko api`)
        const matchedTokenMetadata = JSON.parse(await rp(`${COINGECKO_API_URL}/coins/${matchedTokenObj.id}`))
        if (!matchedTokenMetadata.contract_address) throw new Error(`${symbol} not found in coingecko api`)

        // get decimals using airswap api
        const { decimals } = JSON.parse(
          await rp(`${AIRSWAP_TOKEN_METADATA_URL}/crawlTokenData?address=${matchedTokenMetadata.contract_address}`),
        )

        // resolve with token address and decimals
        resolve({ addr: matchedTokenMetadata.contract_address, decimals })
      } catch (e) {
        reject(e)
      } finally {
        // clean up event loop
        global.clearTimeout(timeout)
      }
    })
  } catch (e) {
    console.log('error while resolving symbol with CoinGecko API:', e.message)
    console.log('falling back to static token metadata')
    tokenAddress = jsonTokensBySymbol[symbol]
  }

  return tokenAddress
}

module.exports = { tokenSymbolResolver }
