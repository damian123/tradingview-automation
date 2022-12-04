var TradingView = require("@mathieuc/tradingview")
var fs = require('fs');
require('dotenv').config();

function runBackTest(pairs) {
    return new Promise((resolve, reject) => {
        for (i in pairs)
        {
            const client = new TradingView.Client({
                token: process.env.TV_SESSION,
                // DEBUG: true
            });

            // Find indicators
            // TradingView.searchIndicator('-- UCTS').then((rs) => {
            //   for(let i in rs) {
            //     console.log('Found Indicators:', rs[i]);
            // }
            // });

            const chart = new client.Session.Chart();
            const pair = pairs[i];
            const timeframe = '1D';
            const range = 365*5;

            chart.setMarket(pair, {
                timeframe: timeframe,
                range: range,
            });

            TradingView.getIndicator('PUB;ryMeUolWwdyo9F3MNleMvPPmoSDpGY4n').then(async (indic) => {

                indic.setOption('commission_type', 'percent');
                indic.setOption('commission_value', 0.1);
                indic.setOption('initial_capital', 100);
                const study = new chart.Study(indic);

                study.onError((...error) => {
                    reject(error[0]);
                    client.end();
                });

                study.onUpdate(() => {

                    let exchange = pair.split(':')[0];
                    let symbol = pair.split(':')[1];

                    fs.writeFileSync(`output/${exchange}-${symbol}-${timeframe}.json`, JSON.stringify(study.strategyReport, null, 4));

                    study.remove();
                    client.end();
                    resolve("done")
                });
            });
        };
    });
};

async function run () {
    const statusesPromise = Promise.allSettled([
        runBackTest(['BINANCE:BTCUSDT']),
        runBackTest(['BINANCE:DOTUSDT']),
    ]);
    const statuses = await statusesPromise;
    console.log(statuses);
}

run()