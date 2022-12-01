var TradingView = require("@mathieuc/tradingview")
var fs = require('fs');
require('dotenv').config();

function runBackTest(pairs) {    
    return new Promise((resolve, reject) => {
        TradingView.loginUser(process.env.TV_USER, process.env.TV_PASSWORD, false).then((user) => {
            for (i in pairs)
            {    
                const client = new TradingView.Client({
                    token: user.session,
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
                    
                    console.log(`Loading '${indic.description}' study...`);
                    
                    indic.setOption('commission_type', 'percent');
                    indic.setOption('commission_value', 0.1);
                    indic.setOption('initial_capital', 100);
                    // indic.setOption('default_qty_value', 99);
                    // indic.setOption('default_qty_type', 'percent_of_equity');
                    // indic.setOption('currency', 'USD');
                    
                    // console.log('inputs', JSON.stringify(indic.inputs, null, 4));
                    
                    const study = new chart.Study(indic);    
                    // console.log('study', JSON.stringify(study, null, 4));

                    // study.strategyReport.settings.dateRange.backtest
                    // console.log('Strategy report', JSON.stringify(study.strategyReport.settings.dateRange.backtest, null, 4));
                    
                    study.onError((...error) => {
                        reject(error[0]);
                        client.end();             
                    });

                    study.onUpdate(() => {
         
                        let exchange = pair.split(':')[0];
                        let symbol = pair.split(':')[1];

                        fs.writeFileSync(`${exchange}-${symbol}-${timeframe}.json`, JSON.stringify(study.strategyReport, null, 4));
                        
                        // for (i in chart.periods) {
                        //   console.log(new Date(chart.periods[i].time*1000).toISOString())
                        // }
                        // console.log(new Date(study.strategyReport.settings.dateRange.backtest.from).toISOString());
                        // console.log(new Date(study.strategyReport.settings.dateRange.backtest.to).toISOString());

                                    
                        study.remove();
                        client.end();
                        resolve("done")
                    });        
                });
            }            
        }).catch((err) => {
            reject(err.message);
        })
    }) 
};

async function run () {
    const statusesPromise = Promise.allSettled([
        runBackTest(['BINANCE:BTCUSDT']),
        runBackTest(['BINANCE:DOTUSDT']),
    ]);
    // wait...
    const statuses = await statusesPromise;
    // after 1 second
    console.log(statuses); 
}

run()