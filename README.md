# Ethereum DEX Prices Service

An open source utility for the Ethereum community.

Find the best price for any asset on any Decentralized Exchange (DEX) at any time.

## Introduction

`ethereum-dex-prices-service` is a JavaScript library for fetching real time price data from Ethereum decentralized exchanges. This repository contains free, open-source tools that anyone can use.

- Quickly launch an HTTP server to serve DEX prices in your applications
- Execute price searches from the command line to find cheap prices and arbitrage opportunities
- Add DEX prices API support in your NodeJS and web projects by simply importing the library's modular classes

#### [Example Web App](https://dexindex.io)

## Quick Start

NPM
`npm install --save ethereum-dex-prices-service`

Yarn
`yarn add ethereum-dex-prices-service`

In your project

```JavaScript
const { main } = require('ethereum-dex-prices-service')

async function getDexPrices() {
  const results = await main('DAI', 500, 'buy')
  results.forEach(obj => {
    // do some stuff
  })
}
```

or just import individual DEX classes

```JavaScript
const { AirSwap } = require('ethereum-dex-prices-service')

async function getAirSwapPrice() {
  const result = await AirSwap.computePrice('DAI', 500, 'buy', 0)
  console.log(result)
}
```

## Architecture

The service is composed of modular ES6 classes. Each decentralized exchange or "DEX" has its own class inside the `exchanges/` directory. Classic order book style DEX's inherit from the base `OrderBookExchange` class. Unique DEX's like AirSwap, Kyber, and Bancor use their own inidividual classes. Every class implements a method called `computePrice` to return price data in a generalized schema.

##### Example Data

###### Price data found

```
{
  "exchangeName": "Bancor",
  "totalPrice": 2.5494668914843825,
  "tokenAmount": 300,
  "tokenSymbol": "MKR",
  "avgPrice": 0.008498222971614608,
  "timestamp": 1548101818616,
  "error": null
}
```

###### No price data found

```
{
  "exchangeName": "Bancor",
  "totalPrice": null,
  "tokenAmount": 300,
  "tokenSymbol": "DAI",
  "avgPrice": null,
  "timestamp": 1548101818616,
  "error": "DAI is not available on Bancor"
}
```

The data can be served in many different ways. There are currently three supported outputs:

- A command line tool `entrypoints/cli.js`
- A web server `entrypoints/server.js`
- A [Serverless](https://serverless.com/framework/) `handler.js`

We would like to eventually add support for:

- An NPM module
- A standalone Electron app with a React UI

Interested in contributing? Check out the [Contributing](#contributing) section below.

## Getting started

##### Pre-requirements

- [NodeJS](https://nodejs.org/en/download/) >= v8.0.0
- [Yarn](https://yarnpkg.com/en/) >= v1.0.0

To run the service and get price data, follow these instructions:

1. Clone this repository
2. Make sure you have [Yarn](https://yarnpkg.com/en/) installed.
3. Install dependencies

```sh
yarn install
```

#### Running the service as a command line tool

```sh
yarn search buy 500 DAI
```

```sh
yarn search sell 300 OMG
```

#### Running the service as a web server

```sh
yarn serve:express
```

You should then see:

```sh
"Dex price server running on port 1337!"
```

Now, make an HTTP request:

```sh
curl http://localhost:1337/sell\?symbol\=DAI\&amount\=500
```

## Commands

- `yarn search <BUY/SELL> <AMOUNT> <SYMBOL>` - Run the command line tool
- `yarn serve:express` - Start the web server

- `yarn debug:cli <BUY/SELL> <AMOUNT> <SYMBOL>` - Run the command line tool in live debugger mode
- `yarn debug:server` - Start the web server in live debugger mode
- `yarn lint` - Lint the code
- `yarn prettier:check` - Check code style
- `yarn prettier:fix` - Fix code style

## Contributing

**Contributions are welcome and encouraged!**
Simply fork this repository or create a new branch and open a pull request against `master`.

Before doing so, make sure to check code quality with ESLint and Prettier. You can use the yarn [Commands](#commands) to accomplish this. You'll want to make sure your code passes `yarn lint` and `yarn prettier:check`.

When opening a PR, please provide a brief summary explaining the changes as well as some code examples to test the functionality. Also, please be prepared to edit your pull request based on comments and feedback.

## License (MIT)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
