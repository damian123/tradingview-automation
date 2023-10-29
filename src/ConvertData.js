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
    const startOfYearTimestamp = new Date('2023-01-01T00:00:00Z').getTime();
    console.log(startOfYearTimestamp);

    walk('./output', function(err, filenames) {
        if (err) throw err;

        fs.writeFileSync(csvFilename, ''); // This will ensure the file is empty
        for (i in filenames)
        {
            let includeHeader = (i == 0);            
            const filename = filenames[i]            
            const backTest = JSON.parse(fs.readFileSync(filename));

            const cumulativeReturnFromLongTrades = (backTest.trades || [])
                .filter(trade => trade.entry.type === 'long' && trade.entry.time >= startOfYearTimestamp)
                .reduce((cumulative, trade) => cumulative + trade.profit.p, 0);

            // const n = path.basename(filename);
            // console.log(n.substring(n.indexOf("-") + 1, n.lastIndexOf("-")));
            // const cumulativeReturnFromLongTrades = (backTest.trades || [])
            // .filter(trade => {
            //     const isValid = trade.entry.type === 'long' && trade.entry.time >= startOfYearTimestamp;
            //     if (isValid) {
            //         console.log("Valid Trade:", trade);
            //     }
            //     return isValid;
            // })
            // .reduce((cumulative, trade) => {
            //     console.log("Adding:", trade.profit.p, "to", cumulative);
            //     return cumulative + trade.profit.p;
            // }, 0);

            backTest['cumulativeYTDReturnFromLongTrades'] = cumulativeReturnFromLongTrades;

            name = path.basename(filename)
            backTest["exchange"] = name.substring(0, name.indexOf("-"));
            backTest["pair"] =  name.substring(name.indexOf("-") + 1, name.lastIndexOf("-"));
            backTest["timeframe"] = name.substring(name.lastIndexOf("-")+1, name.lastIndexOf("."));

            const fields = ['exchange', 
                            'pair', 
                            'timeframe', 
                            // 'performance.all.percentProfitable',
                            // 'performance.all.profitFactor',
                            // 'performance.all.totalTrades',
                            // 'performance.all.netProfitPercent',
                            // 'performance.maxStrategyDrawDownPercent',
                            // 'performance.all.avgTradePercent',
                            // 'performance.all.avgBarsInTrade',
                            'cumulativeYTDReturnFromLongTrades'
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