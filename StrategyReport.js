var TradingView = require("@mathieuc/tradingview")
var fs = require('fs');

// console.log(TradingView.version);

TradingView.loginUser("", "", false).then((user) => {
  
  // console.log('User:', user);
  // console.log('Sessionid:', user.session);

  const client = new TradingView.Client({
    token: user.session,
    // DEBUG: true
  });
 
  // Find security IDs
  // TradingView.searchMarket('BINANCE:').then((rs) => {
  //   console.log('Found Markets:', rs);
  // });
  
  // Find indicators
  // TradingView.searchIndicator('-- UCTS').then((rs) => {
  //   for(let i in rs) {
  //     console.log('Found Indicators:', rs[i]);
  // }    
  // });

    const chart = new client.Session.Chart();
    const pair = 'BINANCE:BTCUSDT';
    const timeframe = '1D';

    chart.setMarket(pair, {        
        timeframe: timeframe,
        currency: 'USD',
        // replay: Math.round(Date.now() / 1000) - 86400 * 7, // Seven days before now
        // range: 1,
  });

  TradingView.getIndicator('PUB;ryMeUolWwdyo9F3MNleMvPPmoSDpGY4n').then(async (indic) => {
    
    console.log(`Loading '${indic.description}' study...`);
    
    indic.setOption('commission_type', 'percent');
    indic.setOption('commission_value', 0.1);
    indic.setOption('initial_capital', 100);
    // indic.setOption('default_qty_value', 99);
    // indic.setOption('default_qty_type', 'percent_of_equity');
    // indic.setOption('currency', 'USDT');
    
    const study = new chart.Study(indic);    
    // console.log('study', JSON.stringify(study, null, 4));

    study.strategyReport.settings.dateRange.backtest
    // console.log('Strategy report', JSON.stringify(study.strategyReport.settings.dateRange.backtest, null, 4));
    

    study.onUpdate(() => {
      // console.log('Strategy report', JSON.stringify(study.strategyReport, null, 4));
      // console.log('Prices periods:', JSON.stringify(chart.periods, null, 4));
      // console.log('Study periods:', JSON.stringify(study.periods, null, 4));

      const performance = study.strategyReport.performance;
      // console.log('performance', performance);
      
      // console.log('all',performance.all);
      // console.log('netProfit',performance.all.netProfit);
      // console.log('netProfitPercent',performance.all.netProfitPercent);

      // console.log('trades', performance.all.totalTrades);
      // console.log('perf',`${Math.round(performance.all.netProfitPercent * 10000) / 100} %`);
      

      // * @prop {PerfReport} [performance.all] Strategy long/short performances
      // * @prop {PerfReport} [performance.long] Strategy long performances
      // * @prop {PerfReport} [performance.short] Strategy short performances
      // * @prop {number} [performance.buyHoldReturn] Strategy Buy & Hold Return
      // * @prop {number} [performance.buyHoldReturnPercent] Strategy Buy & Hold Return percent
      // * @prop {number} [performance.maxDrawDown] Strategy max drawdown
      // * @prop {number} [performance.maxDrawDownPercent] Strategy max drawdown percent
      // * @prop {number} [performance.openPL] Strategy Open P&L (Profit And Loss)
      // * @prop {number} [performance.openPLPercent] Strategy Open P&L (Profit And Loss) percent
      // * @prop {number} [performance.sharpeRatio] Strategy Sharpe Ratio
      // * @prop {number} [performance.sortinoRatio] Strategy Sortino Ratio

      // const createCsvWriter = require('csv-writer').createObjectCsvWriter;
      // const csvWriter = createCsvWriter({
      //   path: 'report.csv',
      //   header: [
      //     {id: 'pair', title: 'Pair'},
      //     {id: 'timeframe', title: 'Timeframe'},
      //     {id: 'netProfit', title: 'NetProfit'},
      //     {id: 'netProfitPercent', title: 'NetProfitPercent'},
      //     // {id: 'totalClosedTrades', title: 'TotalClosedTrades'},
      //     {id: 'percentProfitable', title: 'PercentProfitable'},
      //     {id: 'profitFactor', title: 'ProfitFactor'},
      //     {id: 'maxDrawDownPercent', title: 'MaxDrawDownPercent'},
      //     {id: 'avgTrade', title: 'AvgTrade'},
      //     {id: 'avgTradePercent', title: 'AvgTradePercent'},
      //     {id: 'avgBarsInTrades', title: 'AvgBarsInTrades'},
      //   ]
      // });

      // const data = [
      //   {
      //     pair: pair,
      //     timeframe: timeframe,
      //     netProfit: performance.all.netProfit,
      //     netProfitPercent: performance.all.netProfitPercent,
      //     // totalClosedTrades: performance.all.totalClosedTrades,
      //     percentProfitable: performance.all.percentProfitable,
      //     profitFactor: performance.all.profitFactor,
      //     // maxDrawdown: performance.all.maxDrawdown,
      //     // maxDrawDownPercent: performance.all.maxDrawDownPercent,
      //     avgTrade: performance.all.avgTrade,
      //     avgTradePercent: performance.all.avgTradePercent,
      //     avgBarsInTrades: performance.all.avgBarsInTrade
      //   }
      // ];

      // csvWriter
      //   .writeRecords(data)
      //   .then(()=> console.log('The CSV file was written successfully'));

      study.remove();

      client.end();
    });
  });
  

}).catch((err) => {
  console.error('Login error:', err.message);
});

