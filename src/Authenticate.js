var TradingView = require("@mathieuc/tradingview")
require('dotenv').config();

console.log(`Login to TradingView with user '${process.env.TV_USER}'`);
TradingView.loginUser(process.env.TV_USER, process.env.TV_PASSWORD, true).then((user) => {
    
    console.log(`TradingView session id '${user.session}'`);
    TradingView.getUser(user.session).then((userid) => {
        console.log(`Check TradingView user '${userid.username}'`);
    });
}).catch((err) => {
  console.error('Login error:', err.message);
});
