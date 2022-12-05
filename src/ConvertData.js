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
            if (i == 0)
                includeHeader = true;
            else
                includeHeader = false;

            filename = filenames[i]
            exchange = 'BINANCE';
            const backTest = JSON.parse(fs.readFileSync(filename));
            name = path.basename(filename)
            backTest["exchange"] = name.substring(0, name.indexOf("-"));
            backTest["pair"] =  name.substring(name.indexOf("-") + 1, name.lastIndexOf("-"));
            backTest["timeframe"] = name.substring(name.lastIndexOf("-")+1, name.lastIndexOf("."));

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
                            ];

            const json2csvParser = new Parser({fields, header: includeHeader });
            csv = json2csvParser.parse(backTest);
            if (includeHeader != true)
                csv = '\n' + csv;
            fs.appendFile(csvFilename, csv, function(err) {
                if (err) throw err;
                // console.log(csv);
            });
        };

        console.log("Finished writing data");
      });
}

run()