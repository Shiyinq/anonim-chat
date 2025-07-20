require('dotenv').config()
require('./src/config/database')

const bot = require('./src/bots/telegramBot')
bot.launch()
require('./server')
