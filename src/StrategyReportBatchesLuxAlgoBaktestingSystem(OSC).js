var TradingView = require("@mathieuc/tradingview")
var fs = require('fs');
const { PromisePool } = require('@supercharge/promise-pool');
const { createLogger, format, transports } = require('winston');
const { splat, combine, timestamp, printf } = format;
require('dotenv').config();

// Setup logger
const myFormat = printf( ({ level, message, timestamp , ...metadata}) => {
let msg = `${timestamp} [${level}] : ${message} `  
if(metadata) {
    msg += JSON.stringify(metadata)
}
return msg
});

const logger = createLogger({
level: 'debug',
format: combine(
    format.colorize(),
    splat(),
    timestamp(),
    myFormat
),
transports: [
    new transports.Console({ level: 'info' }),
    new transports.File({ filename: 'errors.log', level: 'error' }),
]
});
module.exports = logger

function getIndicData(chart, indicator) {
    return new Promise((res) => {
      const STD = new chart.Study(indicator);
  
      console.log(indicator.description);
      console.log(indicator.inputs);
  
      STD.onUpdate(() => {
        res(STD.periods);
        console.log(`"${indicator.description}" done !`);
      });
    });
  }

async function runBackTest(pair) {

    return new Promise((resolve, reject) => {
        const client = new TradingView.Client({
            token: process.env.TV_SESSION,
            signature: process.env.TV_SESSION_SIGN,
            // DEBUG: true
        });

        // Find indicators
        // TradingView.searchIndicator('backtesting').then((rs) => {
        //   for(let i in rs) {
        //     console.log('Found Indicators:', rs[i]);
        // }
        // });

        const chart = new client.Session.Chart();
        const timeframe = '45';
        const range = 4000;

        chart.setMarket(pair, {
            timeframe: timeframe,
            range: range,
        });

       
        TradingView.getIndicator('PUB;9752bdf1c3a0419087b77435b1a5f415').then(async (indic) => {                
            
            indic.setOption('initial_capital', 1000);
            indic.setOption('default_qty_type', 'percent_of_equity');
            indic.setOption('default_qty_value', 100);
    
            indic.setOption('Money_Flow', false);
            indic.setOption('Reversals', true);
            indic.setOption('in_15', 'Reversal Up +');
            indic.setOption('Reversals', true);
            indic.setOption('in_46', 'Reversal Down +');            

            // Print all input options to the indicator script, this is useful when I need to know what to set above.
            // console.log('inputs', JSON.stringify(indic.inputs, null, 4));
            // TODO: Save the input once per run and save all outputs in a new folder per run.

            const study = new chart.Study(indic);

            study.onError((...error) => {
                reject(`${pair} ${error[0]}`);
                client.end();
                return;
            });

            study.onUpdate(() => {

                // const last = chart.periods[range-1]
                // console.log("First Date: " + convertUnixTimestamp(last.time));    
                        
                exchange = pair.split(':')[0];
                symbol = pair.split(':')[1];

                fs.writeFileSync(`output/${exchange}-${symbol}-${timeframe}.json`, JSON.stringify(study.strategyReport, null, 4));

                study.remove();
                client.end();
                resolve("done");
                return;
            });
        })
        .catch(e => {
            reject(`${pair} ${e}`);
            client.end();
        });
            return;
    })
};

async function run () {
    // Load token pairs from the symbols file.
    pairs = []

    const logger = createLogger({
        format: format.combine(format.timestamp(), format.json()),
        transports: [new transports.Console(), new transports.File({ level: "error", filename: "errors.log" })],
      });
    
    if (process.env.NODE_ENV !== "production") {
        logger.add(
          new transports.Console({
            format: format.combine(format.colorize(), format.simple()),
          })
        );
      }

    TradingView.getUser(process.env.TV_SESSION, process.env.TV_SESSION_SIGN).then((user) => {
        console.log(`TradingView user id: ${user.username}`);    
        console.log(`TradingView user name: ${user.firstName} ${user.lastName}`);
    });    

    markets = JSON.parse(fs.readFileSync('output/binance-markets.json'));
    for (const m in markets) {
        if (markets[m].id.slice(-4) == 'USDT')
            pairs.push("BINANCE:".concat(markets[m].id));
    }

    const { results, errors } = await PromisePool
      .for(pairs)
      .withConcurrency(1)
      .process(async data => {
        const status = await runBackTest(data)
        return status
    })
    // results.forEach(result => {
    //     logger.info(result);
    //   });
    errors.forEach(error => {
        logger.error(error);
      });
    logger.info("All done.")
}

function convertUnixTimestamp(timestamp) {
    var date = new Date(timestamp * 1000); // Convert to milliseconds
    return date.toUTCString();
}


run()