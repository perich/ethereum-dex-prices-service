const express = require('express')
const { main } = require('../main.js')

const app = express()
const port = 1337

app.use(express.urlencoded({ extended: false }))

app.get('/buy', (req, res) => {
  const { amount, symbol, decimals } = req.query
  if (!amount || !symbol) {
    res.status(500).send('must include "amount" and "symbol" parameters')
  }

  main(symbol.toUpperCase(), parseFloat(amount), 'BUY', decimals || null).then(sortedResponses => {
    console.log(sortedResponses)
    res.status(200).send(sortedResponses)
  })
})
app.get('/sell', (req, res) => {
  const { amount, symbol, decimals } = req.query
  if (!amount || !symbol) {
    res.status(500).send('must include "amount" and "symbol" parameters')
  }

  main(symbol.toUpperCase(), parseFloat(amount), 'SELL', decimals || null).then(sortedResponses => {
    console.log(sortedResponses)
    res.status(200).send(sortedResponses)
  })
})

app.listen(port, () => console.log(`Dex price server running on port ${port}!`))
