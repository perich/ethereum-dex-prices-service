const Uniswap = require('../../exchanges/Uniswap.js')
// const { UNISWAP_FACTORY_ABI, UNISWAP_FACTORY_ADDRESS } = require('../../constants.js')

describe('Uniswap', () => {
  const exchange = new Uniswap()

  const nonExistentSymbol = 'OBVSNOTATOKEN'
  const symbol = 'AST'
  const amount = 500

  const expectedExchangeName = 'Uniswap'
  const bnbErrorMessage = 'BNB cannot be traded on Uniswap due to a bug in the token code as of solc 0.4.22'
  const noTokenMetadataErrorMessage = "no token metadata available for OBVSNOTATOKEN, can't get decimals"
  const noMarketErrorMessage = 'no Uniswap market exists for OBVSNOTATOKEN'

  beforeAll(() => {
    exchange.ethProvider
  })

  describe('computePrice', () => {
    test('errors due to ERC-20 contract bug if symbol is BNB', () => {
      expect(exchange.computePrice('BNB', amount, false)).resolves.toMatchObject({
        Uniswap: {
          exchangeName: expectedExchangeName,
          tokenAmount: 500,
          tokenSymbol: 'BNB',
          timestamp: expect.any(Number),
          error: bnbErrorMessage,
        },
      })
    })

    test('errors when no token metadata is available', () => {
      expect(exchange.computePrice(nonExistentSymbol, amount, false)).resolves.toMatchObject({
        Uniswap: {
          exchangeName: expectedExchangeName,
          tokenAmount: 500,
          tokenSymbol: nonExistentSymbol,
          timestamp: expect.any(Number),
          error: noTokenMetadataErrorMessage,
        },
      })
    })

    test.skip('errors when no market exists for the token on Uniswap', () => {
      // Mock 'await new ethers.Contract(address, tokenAbi, this.ethProvider)' -- can be noop
      // Mock 'await this.factoryContract.getExchange(address)' to return '0x0000000000000000000000000000000000000000'
      
      expect(exchange.computePrice(nonExistentSymbol, amount, false)).resolves.toMatchObject({
        Uniswap: {
          exchangeName: expectedExchangeName,
          tokenAmount: 500,
          tokenSymbol: nonExistentSymbol,
          timestamp: expect.any(Number),
          error: noMarketErrorMessage,
        },
      })
    })

    describe('gracefully handles error', () => {
      test.skip('when constructing interactive contract from address and ABI', () => {
        throw new Error('Not implemented')
      })

      test.skip('when retrieving the exchange address from the factory contract', () => {
        throw new Error('Not implemented')
      })

      test.skip('when getting the ETH reserve of the exchange address', () => {
        throw new Error('Not implemented')
      })

      test.skip('when getting the ERC-20 reserve of the ERC-20 contract', () => {
        throw new Error('Not implemented')
      })
    })

    describe('errors with not enough liquidity', () => {
      describe('when selling', () => {
        test.skip('when there are no bids', () => {
          throw new Error('Not implemented')
        })

        test.skip('when the total amount is greater than all bids', () => {
          throw new Error('Not implemented')
        })
      })

      describe('when buying', () => {
        test.skip('when there are no asks', () => {
          throw new Error('Not implemented')
        })

        test.skip('when the total amount is greater than all asks', () => {
          throw new Error('Not implemented')
        })
      })
    })

    test.skip('returns the average and total prices for a buy order across price levels', () => {
      throw new Error('Not implemented')
    })

    test.skip('returns the average and total prices for a sell order across price levels', () => {
      throw new Error('Not implemented')
    })

    test.skip('returns the average and total prices with full liquidity at one price level', () => {
      throw new Error('Not implemented')
    })
  })
})
