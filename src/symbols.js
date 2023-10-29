const ccxt = require('ccxt')
const fs = require('fs')

const exchange = new ccxt.binance ({
    'verbose': process.argv.includes ('--verbose'),
})

;(async function main () {
    console.log ('CCXT Version:', ccxt.version);

    const markets = await exchange.loadMarkets();

    data = JSON.stringify(markets);
    console.log(exchange['name'] + ' supports ' + Object.keys (markets).length + ' pairs')
    fs.writeFileSync('output/binance-markets.json', data);
    console.log('Markets info written to output/binance-markets.json')
    // log (markets)
    // console.log (exchange.describe ())
}) ()

