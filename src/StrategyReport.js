var TradingView = require("@mathieuc/tradingview")
var fs = require('fs');
require('dotenv').config();

const pairs = ['BINANCE:BTCUSDT', 'BINANCE:FETUSDT'];
// const pairs = []
// markets = JSON.parse(fs.readFileSync('output/binance-markets.json'));
// for (const m in markets) {
//     pairs.push("BINANCE:".concat(markets[m].id));
// }

// Filtering out pairs that don't end with "USDT"
const filteredPairs = pairs.filter(pair => pair.endsWith('USDT'));

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function processPair(pair, client) {
    let retryCount = 0;
    const maxRetries = 5;

    while (retryCount < maxRetries) {
        try {
            const client = new TradingView.Client({
                token: process.env.TV_SESSION,
                signature: process.env.TV_SESSION_SIGN
                // DEBUG: true
            });
        
            const chart = new client.Session.Chart();
            const timeframe = '1D';
            const range = -30;
            const timestamp = 1600000000; // 1698505200;

            chart.setMarket(pair, {
                timeframe: timeframe,
                range: range,
                to: timestamp
            });

            // Using await to wait for the asynchronous call to complete
            const indic = await TradingView.getIndicator('PUB;ryMeUolWwdyo9F3MNleMvPPmoSDpGY4n');

            console.log(`Loading '${indic.description}' study...`);
            // ... Rest of your code within the loop
            indic.setOption('commission_type', 'percent');
            indic.setOption('commission_value', 0.1);
            indic.setOption('initial_capital', 100);
            // indic.setOption('default_qty_value', 99);
            // indic.setOption('default_qty_type', 'percent_of_equity');
            // indic.setOption('currency', 'USD');

            // console.log('inputs', JSON.stringify(indic.inputs, null, 4));

            const study = new chart.Study(indic);
            // console.log('study', JSON.stringify(study, null, 4));            

            await new Promise((resolve, reject) => {
                study.onUpdate(() => {
                    try {
                         // console.log('Strategy report', JSON.stringify(study.strategyReport, null, 4));

                        let exchange = pair.split(':')[0];
                        let symbol = pair.split(':')[1];

                        fs.writeFileSync(`output/${exchange}-${symbol}-${timeframe}.json`, JSON.stringify(study.strategyReport, null, 4));
                        // console.log('Prices periods:', JSON.stringify(chart.periods, null, 4));
                        // console.log('Study periods:', JSON.stringify(study.periods, null, 4));

                        // for (i in chart.periods) {
                        //   console.log(new Date(chart.periods[i].time*1000).toISOString())
                        // }
                        // console.log(new Date(study.strategyReport.settings.dateRange.backtest.from).toISOString());
                        // console.log(new Date(study.strategyReport.settings.dateRange.backtest.to).toISOString());

                        const performance = study.strategyReport.performance;
                        // console.log('performance', performance);

                        study.remove();                
                        console.log('done');
                        resolve();  // Resolve the promise when done
                    } catch (error) {
                        reject(error);  // Reject the promise if there's an error
                    }
                });
            });

            chart.delete();
            await client.end();

            // If successful, break out of the loop
            return;
        } catch (error) {
            if (error.message.includes('Unexpected server response: 429')) {
                console.error(`Rate limited for ${pair}. Retrying in 10 seconds...`);
                await sleep(10000);  // Wait for 10 seconds before retrying
                retryCount++;
            } else {
                console.error(`Error processing ${pair}:`, error.message);
                throw error;  // If it's another error, rethrow so the outer function can handle/log it
            }
        }
    }
}

async function processPairs() {
    const user = await TradingView.getUser(process.env.TV_SESSION, process.env.TV_SESSION_SIGN);
    console.log(`TradingView user id: ${user.username}`);    
    console.log(`TradingView user name: ${user.firstName} ${user.lastName}`);    
    
    for (let i = 0; i < filteredPairs.length; i++) {
        try {
            await processPair(filteredPairs[i]);
            await sleep(1000); // wait for 1 second
        } catch (error) {
            console.error(`Failed to process pair ${filteredPairs[i]} after retries. Moving on to the next pair.`);
        }
    }
}

processPairs().then(() => {
    console.log('All pairs processed.');
}).catch(err => {
    console.error('An error occurred:', err);
});


