var TradingView = require("@mathieuc/tradingview")
var fs = require('fs');
const { PromisePool } = require('@supercharge/promise-pool');
const { createLogger, format, transports } = require('winston');
require('dotenv').config();

function runBackTest(pair) {
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

            study.onUpdate(() => {

                exchange = pair.split(':')[0];
                symbol = pair.split(':')[1];

                fs.writeFileSync(`output/${exchange}-${symbol}-${timeframe}.json`, JSON.stringify(study.strategyReport, null, 4));

                study.remove();
                client.end();
                resolve("done")
            });
        });
    });
};

async function run () {
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
        pairs.push("BINANCE:".concat(markets[m].id));
    }

    const { results, errors } = await PromisePool
      .for(pairs)
      .withConcurrency(1)
      .process(async data => {
        const status = await runBackTest(data)
        return status
    })
    logger.into(results);
    logger.error(errors);
}

run()