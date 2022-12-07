var TradingView = require("@mathieuc/tradingview")
var fs = require('fs');
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

TradingView.getUser(process.env.TV_SESSION).then((user) => {
    logger.info(`TradingView user id: ${user.username}`);    
    logger.info(`TradingView user name: ${user.firstName} ${user.lastName}`);
});

const pairs = ['BINANCE:BTCUSDT', 'BINANCE:DOTUSDT'];
const timeframe = '1D';
const range = 365*5;

for (i in pairs)
{
    const pair = pairs[i]

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
    chart.setMarket(pair, {
        timeframe: timeframe,
        range: range,
    });

    TradingView.getIndicator('PUB;ryMeUolWwdyo9F3MNleMvPPmoSDpGY4n').then(async (indic) => {

        // Set indicator options

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

        const study = new chart.Study(indic);
        // console.log('study', JSON.stringify(study, null, 4));

        study.onUpdate(() => {

            let exchange = pair.split(':')[0];
            let symbol = pair.split(':')[1];

            fs.writeFileSync(`output/${exchange}-${symbol}-${timeframe}.json`, JSON.stringify(study.strategyReport, null, 4));
         
            study.remove();
            client.end();
        });
    });
};

