var TradingView = require("@mathieuc/tradingview")
var fs = require('fs');
const { PromisePool } = require('@supercharge/promise-pool');
const { createLogger, format, transports } = require('winston');
const { splat, combine, timestamp, printf } = format;
require('dotenv').config();

const timeframe = '2D';
const range = 365*5;

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

async function runBackTest(pair) {

    return new Promise((resolve, reject) => {
        const client = new TradingView.Client({
            token: process.env.TV_SESSION,
            signature: process.env.TV_SESSION_SIGN
            // DEBUG: true
        });

        // Find indicators
        // TradingView.searchIndicator('-- UCTS').then((rs) => {
        //   for(let i in rs) {
        //     console.log('Found Indicators:', rs[i]);
        // }
        // });

        const chart = new client.Session.Chart();
        const timeframe = '2D';
        const range = 365*3;

        chart.setMarket(pair, {
            timeframe: timeframe,
            range: range,
        });

        TradingView.getIndicator('PUB;ryMeUolWwdyo9F3MNleMvPPmoSDpGY4n').then(async (indic) => {

            console.log(`Loading '${indic.description}' study...`);

            indic.setOption('commission_type', 'percent');
            indic.setOption('commission_value', 0.1);
            indic.setOption('initial_capital', 100);
            const study = new chart.Study(indic);

            study.onError((...error) => {
                reject(error[0]);
                client.end();
            });

            // Find indicators
            // TradingView.searchIndicator('-- UCTS').then((rs) => {
            //   for(let i in rs) {
            //     console.log('Found Indicators:', rs[i]);
            // }
            // });

            const chart = new client.Session.Chart();
            
            chart.setMarket(pair, {
                timeframe: timeframe,
                range: range,
            });
            chart.onError((...error) => {
                logger.error(`Error when settijng market for ${pair}: ${error[0]}`);
                reject(`${pair} ${error[0]}`);
                client.end();
                return;
            });
           
            TradingView.getIndicator('PUB;ryMeUolWwdyo9F3MNleMvPPmoSDpGY4n').then(async (indic) => {

                // Fees paid for each entry and exit
                indic.setOption('commission_type', 'percent'); 
                indic.setOption('commission_value', 0.1);

                indic.setOption('_INDICATOR_SETTINGS_', true); 
                        
                // The amount of funds initially available for the strategy to trade
                indic.setOption('initial_capital', 100); 
                
                // Enables an additional calculation on bar close, allowing market orders to enter on the same tick the order is placed
                indic.setOption('process_orders_on_close', true);         
                
                //The number of contracts/shares/lots/units per trade, or the amount in base currency, or a percentage of available equity
                indic.setOption('default_qty_type', 'percent_of_equity');
                indic.setOption('default_qty_value', 99);

                // Calculate Short Trades under the Strategy Tester?
                indic.setOption('Calculate_Short_Trades_under_the_Strategy_Tester', true);

                // Activate SAFE_MODE (check additional criteria for Signals)
                indic.setOption('_Activate_SAFE_MODE_check_additional_criteria_for_Signals', false);
                // Type '1' for regular Safe Mode or Type '2' high safety mode
                indic.setOption('Type_1_for_regular_Safe_Mode_or_Type_2_high_safety_mode', 1);
                
                // indic.setOption('currency', 'USDT'); // Can't set this only USD which is not what I want for my pairs.

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

                    exchange = pair.split(':')[0];
                    symbol = pair.split(':')[1];

                    fs.writeFileSync(`output/${exchange}-${symbol}-${timeframe}.json`, JSON.stringify(study.strategyReport, null, 4));

                    study.remove();
                    client.end();
                    resolve("done")
                    return;
                });
            });
        }
        catch(e) {
            reject(`${pair} ${e}`);
            client.end();
            return;
        }    
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

run()