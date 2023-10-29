var TradingView = require("@mathieuc/tradingview")
require('dotenv').config();

const user = await TradingView.getUser(process.env.TV_SESSION, process.env.TV_SESSION_SIGN);
    console.log(`TradingView user id: ${user.username}`);    
    console.log(`TradingView user name: ${user.firstName} ${user.lastName}`);    
