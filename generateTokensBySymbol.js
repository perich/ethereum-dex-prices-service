const fs = require('fs')

const tokensBySymbol = {}

function readFiles(dirname) {
  fs.readdir(dirname, (err, filenames) => {
    if (err) {
      console.error(err)
      return
    }
    filenames.forEach(filename => {
      const rawdata = fs.readFileSync(dirname + filename)
      const data = JSON.parse(rawdata)
      tokensBySymbol[data.symbol] = data
    })

    fs.writeFile('tokensBySymbol.json', global.JSON.stringify(tokensBySymbol), console.error)
  })
}

readFiles('./tokens/')
