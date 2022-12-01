var TradingView = require("@mathieuc/tradingview")
var fs = require('fs');
require('dotenv').config();

TradingView.loginUser(process.env.TV_USER, process.env.TV_PASSWORD, false).then((user) => {
  
  let pairs = ['BINANCE:BTCUSDT', 'BINANCE:DOTUSDT'];

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
        

        study.onUpdate(() => {
            // console.log('Strategy report', JSON.stringify(study.strategyReport, null, 4));      

            let exchange = pair.split(':')[0];
            let symbol = pair.split(':')[1];

            fs.writeFileSync(`${exchange}-${symbol}-${timeframe}.json`, JSON.stringify(study.strategyReport, null, 4));
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
            client.end();
            console.log('done');
        });
    });
  }  

}).catch((err) => {
  console.error('Login error:', err.message);
});

