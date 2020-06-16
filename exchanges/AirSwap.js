const { Indexer, Server } = require('@airswap/protocols')
const { chainIds } = require('@airswap/constants')
const {
  isValidQuote,
  getBestByLowestSenderAmount,
  getBestByLowestSignerAmount,
  toDecimalString,
} = require('@airswap/utils')

const ethers = require('ethers')
const { WETH_ADDRESS } = require('../constants.js')
const { tokenSymbolResolver } = require('../tokenSymbolResolver.js')

const { utils } = ethers

module.exports = class AirSwap {
  constructor() {
    this.name = 'AirSwap'
  }

  async computePrice(symbol, desiredAmount, isSell) {
    let result = {}

    try {
      const { addr, decimals } = await tokenSymbolResolver(symbol)
      const signerToken = isSell ? WETH_ADDRESS : addr
      const senderToken = isSell ? addr : WETH_ADDRESS
      const desiredAmountAtomic = utils.parseUnits(desiredAmount.toString(), decimals)

      // Fetch Server locators from the Indexer
      const { locators } = await new Indexer(chainIds.MAINNET).getLocators(signerToken, senderToken)

      // Iterate to get quotes from all Servers.
      const quotePromises = []
      locators.forEach(async locator => {
        if (isSell) {
          quotePromises.push(
            new Server(locator).getSignerSideQuote(desiredAmountAtomic, signerToken, senderToken).catch(e => e),
          )
        } else {
          quotePromises.push(
            new Server(locator).getSenderSideQuote(desiredAmountAtomic, signerToken, senderToken).catch(e => e),
          )
        }
      })

      const quotes = (await Promise.all(quotePromises)).filter(isValidQuote)
      const best = isSell ? getBestByLowestSignerAmount(quotes) : getBestByLowestSenderAmount(quotes)
      if (!best) throw new Error('No quotes returned by any AirSwap maker')
      const formattedSignerAmount = isSell
        ? parseFloat(toDecimalString(best.signer.amount, 18))
        : parseFloat(toDecimalString(best.signer.amount, decimals))
      const formattedSenderAmount = isSell
        ? parseFloat(toDecimalString(best.sender.amount, decimals))
        : parseFloat(toDecimalString(best.sender.amount, 18))

      result = {
        exchangeName: this.name,
        totalPrice: isSell ? formattedSignerAmount : formattedSenderAmount,
        tokenAmount: isSell ? formattedSenderAmount : formattedSignerAmount,
        tokenSymbol: symbol,
        avgPrice: isSell
          ? formattedSignerAmount / formattedSenderAmount
          : formattedSenderAmount / formattedSignerAmount,
        timestamp: Date.now(),
        error: null,
      }
    } catch (e) {
      result = {
        exchangeName: this.name,
        timestamp: Date.now(),
        error: e.message,
        tokenSymbol: symbol,
        tokenAmount: desiredAmount,
      }
    }

    return { [this.name]: result }
  }
}
