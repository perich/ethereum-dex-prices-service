const Ethfinex = require('../../exchanges/Ethfinex.js')
const { ETHFINEX_URL } = require('../../constants.js')

describe('Ethfinex', () => {
  const exchange = new Ethfinex()

  const symbol = 'abc'
  const amount = 500
  const fee = 0

  const noPriceDataMessage = 'no price data found on Ethfinex for abc'
  const noLiquidityMessage = 'not enough liquidity on Ethfinex for 500 abc'

  test('defines the proper markets endpoint', () => {
    expect(exchange.marketsUrl).toBe(`${ETHFINEX_URL}/symbols`)
  })

  test('defines the proper orderbook endpoint', () => {
    expect(exchange.orderbookUrl).toBe(`${ETHFINEX_URL}/book`)
  })

  describe('computePrice', () => {
    const markets = ['abceth', 'defeth']
    const bids = [{ price: '1.00', amount: '300' }, { price: '2.00', amount: '200' }]
    const asks = [{ price: '3.00', amount: '200' }, { price: '4.00', amount: '300' }]
    const orderBook = { asks, bids }

    describe('errors with no price data', () => {
      test('when an error occurs while getting the available markets', () => {
        const getAvailableMarkets = jest.spyOn(exchange, 'getAvailableMarkets')
        getAvailableMarkets.mockRejectedValue(new Error('something went wrong in getAvailableMarkets'))

        expect(exchange.computePrice(symbol, amount, false, fee)).resolves.toMatchObject({
          Ethfinex: {
            exchangeName: 'Ethfinex',
            tokenAmount: amount,
            tokenSymbol: symbol,
            timestamp: expect.any(Number),
            error: noPriceDataMessage,
          },
        })
      })

      test('when an ETH market for the token does not exist', () => {
        const getAvailableMarkets = jest.spyOn(exchange, 'getAvailableMarkets')
        const badMarkets = ['defeth', 'xyzeth', 'abcbtc', 'defbtc', 'xyzbtc']
        getAvailableMarkets.mockResolvedValue(badMarkets)

        // TODO: Optimally we can spy on the error being thrown to assert the code flow
        // const _validateMarketAvailability = jest.spyOn(exchange, '_validateMarketAvailability')

        expect(exchange.computePrice(symbol, amount, false, fee)).resolves.toMatchObject({
          Ethfinex: {
            exchangeName: 'Ethfinex',
            tokenAmount: amount,
            tokenSymbol: symbol,
            timestamp: expect.any(Number),
            error: noPriceDataMessage,
          },
        })
      })

      test('when an error occurs while retrieving the order book', () => {
        const getAvailableMarkets = jest.spyOn(exchange, 'getAvailableMarkets')
        getAvailableMarkets.mockResolvedValue(markets)

        const _getRawOrderBook = jest.spyOn(exchange, '_getRawOrderBook')
        _getRawOrderBook.mockImplementation(() => {
          throw new Error('something went wrong in _getRawOrderBook')
        })

        // TODO: Optimally we can spy on the error being thrown to assert the code flow
        // const _validateMarketAvailability = jest.spyOn(exchange, '_validateMarketAvailability')

        expect(exchange.computePrice(symbol, amount, false, fee)).resolves.toMatchObject({
          Ethfinex: {
            exchangeName: 'Ethfinex',
            tokenAmount: amount,
            tokenSymbol: symbol,
            timestamp: expect.any(Number),
            error: noPriceDataMessage,
          },
        })
      })
    })

    describe('errors with not enough liquidity', () => {
      describe('when selling', () => {
        test('when there are no bids', () => {
          const getAvailableMarkets = jest.spyOn(exchange, 'getAvailableMarkets')
          getAvailableMarkets.mockResolvedValue(markets)

          const _getRawOrderBook = jest.spyOn(exchange, '_getRawOrderBook')
          _getRawOrderBook.mockResolvedValue({ asks, bids: [] })

          expect(exchange.computePrice(symbol, amount, true, fee)).resolves.toMatchObject({
            Ethfinex: {
              exchangeName: 'Ethfinex',
              tokenAmount: amount,
              tokenSymbol: symbol,
              timestamp: expect.any(Number),
              error: noLiquidityMessage,
            },
          })
        })

        test('when the total amount is greater than all bids', () => {
          const getAvailableMarkets = jest.spyOn(exchange, 'getAvailableMarkets')
          getAvailableMarkets.mockResolvedValue(markets)

          const _getRawOrderBook = jest.spyOn(exchange, '_getRawOrderBook')
          _getRawOrderBook.mockResolvedValue({
            bids: [{ price: '1.00', amount: '200' }, { price: '2.00', amount: '100' }],
            asks,
          })

          expect(exchange.computePrice(symbol, amount, true, fee)).resolves.toMatchObject({
            Ethfinex: {
              exchangeName: 'Ethfinex',
              tokenAmount: amount,
              tokenSymbol: symbol,
              timestamp: expect.any(Number),
              error: noLiquidityMessage,
            },
          })
        })
      })

      describe('when buying', () => {
        test('when there are no asks', () => {
          const getAvailableMarkets = jest.spyOn(exchange, 'getAvailableMarkets')
          getAvailableMarkets.mockResolvedValue(markets)

          const _getRawOrderBook = jest.spyOn(exchange, '_getRawOrderBook')
          _getRawOrderBook.mockResolvedValue({ asks: [], bids })

          expect(exchange.computePrice(symbol, amount, false, fee)).resolves.toMatchObject({
            Ethfinex: {
              exchangeName: 'Ethfinex',
              tokenAmount: amount,
              tokenSymbol: symbol,
              timestamp: expect.any(Number),
              error: noLiquidityMessage,
            },
          })
        })

        test('when the total amount is greater than all asks', () => {
          const getAvailableMarkets = jest.spyOn(exchange, 'getAvailableMarkets')
          getAvailableMarkets.mockResolvedValue(markets)

          const _getRawOrderBook = jest.spyOn(exchange, '_getRawOrderBook')
          _getRawOrderBook.mockResolvedValue({
            bids,
            asks: [{ price: '3.00', amount: '100' }, { price: '4.00', amount: '200' }],
          })

          expect(exchange.computePrice(symbol, amount, false, fee)).resolves.toMatchObject({
            Ethfinex: {
              exchangeName: 'Ethfinex',
              tokenAmount: amount,
              tokenSymbol: symbol,
              timestamp: expect.any(Number),
              error: noLiquidityMessage,
            },
          })
        })
      })
    })

    test('returns the average and total prices for a buy order across price levels', () => {
      const getAvailableMarkets = jest.spyOn(exchange, 'getAvailableMarkets')
      getAvailableMarkets.mockResolvedValue(markets)

      const _getRawOrderBook = jest.spyOn(exchange, '_getRawOrderBook')
      _getRawOrderBook.mockResolvedValue(orderBook)

      expect(exchange.computePrice(symbol, amount, false, fee)).resolves.toMatchObject({
        Ethfinex: {
          exchangeName: 'Ethfinex',
          totalPrice: 1800.0,
          tokenAmount: amount,
          tokenSymbol: symbol,
          avgPrice: 3.6,
          timestamp: expect.any(Number),
          error: null,
        },
      })
    })

    test('returns the average and total prices for a sell order across price levels', () => {
      const getAvailableMarkets = jest.spyOn(exchange, 'getAvailableMarkets')
      getAvailableMarkets.mockResolvedValue(markets)

      const _getRawOrderBook = jest.spyOn(exchange, '_getRawOrderBook')
      _getRawOrderBook.mockResolvedValue(orderBook)

      expect(exchange.computePrice(symbol, amount, true, fee)).resolves.toMatchObject({
        Ethfinex: {
          exchangeName: 'Ethfinex',
          totalPrice: 700.0,
          tokenAmount: amount,
          tokenSymbol: symbol,
          avgPrice: 1.4,
          timestamp: expect.any(Number),
          error: null,
        },
      })
    })

    test('returns the average and total prices with full liquidity at one price level', () => {
      const getAvailableMarkets = jest.spyOn(exchange, 'getAvailableMarkets')
      getAvailableMarkets.mockResolvedValue(markets)

      const _getRawOrderBook = jest.spyOn(exchange, '_getRawOrderBook')
      _getRawOrderBook.mockResolvedValue({
        asks: [{ price: '2.00', amount: '500.00' }],
        bids,
      })

      expect(exchange.computePrice(symbol, amount, false, fee)).resolves.toMatchObject({
        Ethfinex: {
          exchangeName: 'Ethfinex',
          totalPrice: 1000.0,
          tokenAmount: amount,
          tokenSymbol: symbol,
          avgPrice: 2.0,
          timestamp: expect.any(Number),
          error: null,
        },
      })
    })
  })
})
