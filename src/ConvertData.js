const { Parser } = require('json2csv');
const fs = require("fs");
var path = require('path');

var walk = function(dir, done) {
  var results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    var pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      if (file.endsWith('-1D.json'))
        results.push(file);
      if (!--pending) done(null, results);
    });
  });
};

async function run () {

    const csvFilename = 'output/report_data.csv'

    walk('./output', function(err, filenames) {
        if (err) throw err;

        for (i in filenames)
        {
            filename = filenames[i]
            exchange = 'BINANCE';
            const backTest = JSON.parse(fs.readFileSync(filename));
            basename = path.basename(filename)
            backTest["exchange"] = basename.substring(0, basename.indexOf("-"));
            backTest["pair"] =  basename.substring(basename.indexOf("-") + 1, basename.lastIndexOf("-"));
            backTest["timeframe"] = basename.substring(basename.lastIndexOf("-")+1, basename.lastIndexOf("."));
            
            const fields = ['exchange',
                            'pair',
                            'timeframe',
                            'performance.all.percentProfitable',
                            'performance.all.profitFactor',
                            'performance.all.totalTrades',
                            'performance.all.netProfitPercent',
                            'performance.maxStrategyDrawDownPercent',
                            'performance.all.avgTradePercent',
                            'performance.all.avgBarsInTrade',
                            "settings.dateRange.backtest.from",
                            "settings.dateRange.backtest.to",
                            ];

            includeHeader = i==0 ? true : false; // Only write the header in the csv file at the first row
            const json2csvParser = new Parser({fields, header: includeHeader });
            csv = json2csvParser.parse(backTest);
            if (includeHeader == true) {
              fs.unlink(csvFilename, (err) => { // Delete the exiting csv file if it exists. 
                if (err) {
                  if (err.code !== 'ENOENT') { // ignore the error if the file is not already there.
                    throw err;
                  }
                }
              });
            }
            else  {
              csv = '\n' + csv;
            }
            fs.appendFile(csvFilename, csv, function(err) {
                if (err) throw err;
            });
        };

        console.log("Finished writing data");
      });
}

run()