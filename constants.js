const PARADEX_URL = 'http://api.paradex.io/api/v1'
const IDEX_URL = 'https://api.idex.market'
const KYBER_URL = 'https://api.kyber.network'
const BANCOR_URL = 'https://api.bancor.network/0.1'
const DDEX_URL = 'https://api.ddex.io/v3'
const RADAR_RELAY_URL = 'https://api.radarrelay.com/v2'
const ETHFINEX_URL = 'https://api.ethfinex.com/trustless/v1/endpoint'
const SATURN_URL = 'https://ticker.saturn.network/api/v2'
const FORKDELTA_URL = 'https://api.forkdelta.com'
const AIRSWAP_TOKEN_METADATA_URL = 'https://token-metadata.production.airswap.io'
const SWITCHEO_URL = 'https://api.switcheo.network'
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'
const BAMBOO_RELAY_URL = 'https://rest.bamboorelay.com/main/0x'

// DDEX charges a 0.3% taker fee
const DDEX_TAKER_FEE = 0.003

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

const ETH2DAI_ADDRESS = '0x794e6e91555438aFc3ccF1c5076A74F42133d08D'
const ETH2DAI_ABI = [
  {
    name: 'getBuyAmount',
    outputs: [{ name: 'fill_amt', type: 'uint256' }],
    inputs: [
      { name: 'buy_gem', type: 'address' },
      { name: 'pay_gem', type: 'address' },
      { name: 'pay_amt', type: 'uint256' },
    ],
    constant: true,
    payable: false,
    type: 'function',
  },
  {
    name: 'getPayAmount',
    outputs: [{ name: 'fill_amt', type: 'uint256' }],
    inputs: [
      { name: 'pay_gem', type: 'address' },
      { name: 'buy_gem', type: 'address' },
      { name: 'buy_amt', type: 'uint256' },
    ],
    constant: true,
    payable: false,
    type: 'function',
  },
]

const SNX_TOKEN_ADDRESS = '0xc011a72400e58ecd99ee497cf89e3775d4bd732f'
const SNX_PROXY_ADDRESS = '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f'
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const WETH_DECIMALS = 18

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
  USDC: { decimals: 18, levels: calculateLevels(100) },
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
  DDEX_TAKER_FEE,
  RADAR_RELAY_URL,
  AIRSWAP_TOKEN_METADATA_URL,
  ETHFINEX_URL,
  SATURN_URL,
  FORKDELTA_URL,
  TOP_TOKENS_DECIMAL_MAP,
  UNISWAP_FACTORY_ADDRESS,
  UNISWAP_FACTORY_ABI,
  ETH2DAI_ADDRESS,
  ETH2DAI_ABI,
  WETH_ADDRESS,
  WETH_DECIMALS,
  SWITCHEO_URL,
  COINGECKO_API_URL,
  BAMBOO_RELAY_URL,
  SNX_TOKEN_ADDRESS,
  SNX_PROXY_ADDRESS,
}
