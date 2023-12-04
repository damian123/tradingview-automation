const TradingView = require('@mathieuc/tradingview');

const client = new TradingView.Client()
const chart = new client.Session.Chart()
chart.setMarket('BINANCE:WLDUSDT', {
  timeframe: '45',
  range: 4000
})
chart.onUpdate(() => {
    const last = chart.periods[3999]
    console.log(convertUnixTimestamp(last.time));    
    
    client.end()

})

function convertUnixTimestamp(timestamp) {
    var date = new Date(timestamp * 1000); // Convert to milliseconds
    return date.toUTCString();
}
