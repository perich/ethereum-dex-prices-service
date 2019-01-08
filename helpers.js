module.exports = {
  sortBids(a, b) {
    const [aData] = Object.values(a)
    const [bData] = Object.values(b)

    if (aData.totalPrice && !bData.totalPrice) return -1
    if (!aData.totalPrice && bData.totalPrice) return 1
    if (aData.totalPrice && bData.totalPrice) {
      if (aData.totalPrice > bData.totalPrice) return -1
      if (aData.totalPrice < bData.totalPrice) return 1
    }
    return 0
  },
  sortAsks(a, b) {
    const [aData] = Object.values(a)
    const [bData] = Object.values(b)

    if (aData.totalPrice && !bData.totalPrice) return -1
    if (!aData.totalPrice && bData.totalPrice) return 1
    if (aData.totalPrice && bData.totalPrice) {
      if (aData.totalPrice > bData.totalPrice) return 1
      if (aData.totalPrice < bData.totalPrice) return -1
    }
    return 0
  },
  pipeResultsToCommandLine(sortedResults, symbol, amount, direction) {
    const bestPriceDex = sortedResults[0]
    const [bestDexName, bestDexData] = Object.entries(bestPriceDex)[0]
    if (bestDexData.totalPrice) {
      console.log('✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨')
      console.log(
        '\x1b[32m%s\x1b[0m',
        `You can find the best price on ${bestDexName}! ${direction} ${amount} @ ${bestDexData.avgPrice} ${symbol}/ETH`,
      )
      console.log('✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨')
    } else {
      console.log('No good orders found! 😢')
    }
    console.log(sortedResults)
  },
}
