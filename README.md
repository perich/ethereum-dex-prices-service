## Ethereum DEX Worker

A NodeJS service that finds the best prices across popular Ethereum decentralized exchanges and marketplaces.

#### Under Construction

This repo is currently in a _proof of concept_ stage. The first iteration of the service is a simple command line application with support for five popular decentralized trading solutions. The service can eventually be deployed as a web service to power a web front end.

The end goal of this project is to provide an open source utility for anyone in the Ethereum community to find the best price for **any asset on any DEX at any time.**

#### Getting Started (on a Unix based OS)

- Clone this repository locally
- Install yarn if you haven't already with `brew install yarn`
- Install dependencies in this directory with `yarn install`
- Search for prices with `yarn search <AMOUNT> <SYMBOL> <DECIMALS>`. `<DECIMALS>` are optional. Providing them enables support for searching more DEXes (same APIs require them).
  **Examples:**
  - `yarn search 500 OMG 18`
  - `yarn search 2000 DAI`

#### Contributing

- Use `yarn debug` to enter the live NodeJS debugger
- Use `yarn lint` to check your code against the linter
- Use `yarn prettier:check` to check your code's formatting/style
- Use `yarn prettier:fix` to fix your code's formatting/style
- Want to add another DEX? Simply open a PR that adds a new class that wraps the DEX's API. Order Book exchanges should extend the `OrderBookExchange` class and implement the `_createCanonicalOrderBook` method. You can use the existing classes as examples.
