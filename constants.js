const PARADEX_URL = 'http://api.paradex.io/api/v1'
const IDEX_URL = 'https://api.idex.market'
const KYBER_URL = 'https://api.kyber.network'
const BANCOR_URL = 'https://api.bancor.network/0.1'
const DDEX_URL = 'https://api.ddex.io/v3'
const RADAR_RELAY_URL = 'https://api.radarrelay.com/v2'
const ETHFINEX_URL = 'https://api.ethfinex.com/v1'
const SATURN_URL = 'https://ticker.saturn.network/api/v2'
const FORKDELTA_URL = 'https://api.forkdelta.com'
const AIRSWAP_TOKEN_METADATA_URL = 'https://token-metadata.production.airswap.io'

const UNISWAP_FACTORY_ADDRESS = '0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95'
const UNISWAP_FACTORY_ABI = [
  {
    name: 'NewExchange',
    inputs: [{ type: 'address', name: 'token', indexed: true }, { type: 'address', name: 'exchange', indexed: true }],
    anonymous: false,
    type: 'event',
  },
  {
    name: 'initializeFactory',
    outputs: [],
    inputs: [{ type: 'address', name: 'template' }],
    constant: false,
    payable: false,
    type: 'function',
    gas: 35725,
  },
  {
    name: 'createExchange',
    outputs: [{ type: 'address', name: 'out' }],
    inputs: [{ type: 'address', name: 'token' }],
    constant: false,
    payable: false,
    type: 'function',
    gas: 187911,
  },
  {
    name: 'getExchange',
    outputs: [{ type: 'address', name: 'out' }],
    inputs: [{ type: 'address', name: 'token' }],
    constant: true,
    payable: false,
    type: 'function',
    gas: 715,
  },
  {
    name: 'getToken',
    outputs: [{ type: 'address', name: 'out' }],
    inputs: [{ type: 'address', name: 'exchange' }],
    constant: true,
    payable: false,
    type: 'function',
    gas: 745,
  },
  {
    name: 'getTokenWithId',
    outputs: [{ type: 'address', name: 'out' }],
    inputs: [{ type: 'uint256', name: 'token_id' }],
    constant: true,
    payable: false,
    type: 'function',
    gas: 736,
  },
  {
    name: 'exchangeTemplate',
    outputs: [{ type: 'address', name: 'out' }],
    inputs: [],
    constant: true,
    payable: false,
    type: 'function',
    gas: 633,
  },
  {
    name: 'tokenCount',
    outputs: [{ type: 'uint256', name: 'out' }],
    inputs: [],
    constant: true,
    payable: false,
    type: 'function',
    gas: 663,
  },
]

const TOP_TOKENS_DECIMAL_MAP = {
  BNB: { decimals: 18, levels: calculateLevels(20) },
  MKR: { decimals: 18, levels: calculateLevels(0.25) },
  OMG: { decimals: 18, levels: calculateLevels(65) },
  ZIL: { decimals: 12, levels: calculateLevels(5000) },
  ZRX: { decimals: 18, levels: calculateLevels(312) },
  BAT: { decimals: 18, levels: calculateLevels(715) },
  LINK: { decimals: 18, levels: calculateLevels(250) },
  REP: { decimals: 18, levels: calculateLevels(10) },
  GNO: { decimals: 18, levels: calculateLevels(8) },
  DAI: { decimals: 18, levels: calculateLevels(100) },
  MANA: { decimals: 18, levels: calculateLevels(2000) },
  WTC: { decimals: 18, levels: calculateLevels(83) },
  BNT: { decimals: 18, levels: calculateLevels(140) },
  KNC: { decimals: 18, levels: calculateLevels(625) },
  LRC: { decimals: 18, levels: calculateLevels(2222) },
  REN: { decimals: 18, levels: calculateLevels(4000) },
  AST: { decimals: 18, levels: calculateLevels(3333) },
  LOOM: { decimals: 18, levels: calculateLevels(2000) },
  FUN: { decimals: 18, levels: calculateLevels(25000) },
  REQ: { decimals: 18, levels: calculateLevels(4000) },
  SNT: { decimals: 18, levels: calculateLevels(4000) },
}

function calculateLevels(firstLevel) {
  const results = [firstLevel]
  results.push(firstLevel * 2.5)
  results.push(results[1] * 2.5)
  results.push(results[2] * 2.5)
  return results
}

module.exports = {
  PARADEX_URL,
  IDEX_URL,
  KYBER_URL,
  BANCOR_URL,
  DDEX_URL,
  RADAR_RELAY_URL,
  AIRSWAP_TOKEN_METADATA_URL,
  ETHFINEX_URL,
  SATURN_URL,
  FORKDELTA_URL,
  TOP_TOKENS_DECIMAL_MAP,
  UNISWAP_FACTORY_ADDRESS,
  UNISWAP_FACTORY_ABI,
}
