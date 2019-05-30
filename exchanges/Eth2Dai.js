const ethers = require('ethers')
const { tokenSymbolResolver } = require('../tokenSymbolResolver.js')
const { ETH2DAI_ABI, ETH2DAI_ADDRESS, WETH_ADDRESS, WETH_DECIMALS } = require('../constants.js')

const { utils } = ethers

module.exports = class Eth2Dai {
  constructor() {
    this.ethProvider = ethers.getDefaultProvider('homestead')
    this.exchangeContract = new ethers.Contract(ETH2DAI_ADDRESS, ETH2DAI_ABI, this.ethProvider)
    this.name = 'Eth2Dai'
  }

  async computePrice(symbol, desiredAmount, isSell) {
    let result = {}
    try {
      // Even though the smart contract that powers ETH2DAI is totally open and allows trading on
      // any pairs, only WETH/DAI is supported by the frontend so we raise an exception for other tokens.
      // Otherwise we would be misleading users.
      if (symbol !== 'DAI') {
        throw new Error('only DAI is supported on ETH2DAI at the moment')
      }

      const { addr, decimals } = await tokenSymbolResolver(symbol)

      const desiredAmountInWei = utils.parseUnits(desiredAmount.toString(), decimals)
      const totalPriceInWei = isSell
        ? await this.exchangeContract.getBuyAmount(WETH_ADDRESS, addr, desiredAmountInWei)
        : await this.exchangeContract.getPayAmount(WETH_ADDRESS, addr, desiredAmountInWei)

      const totalPrice = parseFloat(utils.formatUnits(utils.bigNumberify(totalPriceInWei.toString()), WETH_DECIMALS))
      const avgPrice = totalPrice / desiredAmount

      result = {
        exchangeName: this.name,
        totalPrice,
        tokenAmount: desiredAmount,
        tokenSymbol: symbol,
        avgPrice,
        timestamp: Date.now(),
        error: null,
      }
    } catch (e) {
      result = {
        exchangeName: this.name,
        timestamp: Date.now(),
        error: e.message,
        tokenSymbol: symbol,
        tokenAmount: parseFloat(desiredAmount),
      }
    }
    return { [this.name]: result }
  }
}
