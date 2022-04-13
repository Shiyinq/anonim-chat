require('dotenv').config()
require('./config/database')

const text = require(`./config/lang/${process.env.LANGUAGE}`)

const express = require('express')
const app = express()
const port = process.env.PORT || 5000

const { Telegraf} = require('telegraf')
const bot = new Telegraf(process.env.BOT_TOKEN)

const MatchMaker = require('./matchmaker')
let Matchmaker = new MatchMaker()

Matchmaker.init()

bot.start((ctx) => {
    ctx.reply(text.START)
})

bot.command('contribute', (ctx) => {
    ctx.reply(text.CONTRIBUTE)
})

bot.command('help', (ctx) => {
    ctx.reply(text.HELP)
})

bot.command('ping', (ctx) => {
    const start = new Date()
    const s = start / 1000 - ctx.message.date
    ctx.replyWithHTML(`${text.PING} - <code>⏱ ${s.toFixed(3)} s</code>`)
})

bot.command('find', (ctx) => {
    let id = ctx.message.chat.id
    Matchmaker.find(id)
})

bot.command('next', (ctx) => { 
    let id = ctx.message.chat.id
    Matchmaker.next(id)
})

bot.command('stop', (ctx) => {
    let id = ctx.message.chat.id
    Matchmaker.stop(id)
})

bot.command('exit', (ctx) => {
    let id = ctx.message.chat.id
    Matchmaker.exit(id)
})

bot.on('text', (ctx) => {
    let id = ctx.message.chat.id
    let message = ctx.message.text
    Matchmaker.connect(id, ['text', message])
})

bot.on('sticker', (ctx) => {
    let id = ctx.message.chat.id
    let stickerID = ctx.message.sticker.file_id
    Matchmaker.connect(id, ['sticker', stickerID])
})

bot.on('photo', (ctx) => {
    let id = ctx.message.chat.id
    let photos = ctx.message.photo
    let photoID = photos[photos.length - 1].file_id
    Matchmaker.connect(id, ['photo', photoID])
})

bot.on('voice', (ctx) => {
    let id = ctx.message.chat.id
    let voiceID = ctx.message.voice.file_id
    Matchmaker.connect(id, ['voice', voiceID])
})

bot.on('video', (ctx) => {
    let id = ctx.message.chat.id
    let videoID = ctx.message.video.file_id
    Matchmaker.connect(id, ['video', videoID])
})

bot.on('callback_query', (ctx) => {
    let query = ctx.callbackQuery.data.split('-')
  
    switch (query[0]) {
        case 'openPhoto':
            let urlPhoto = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/photos/${query[1]}`
            ctx.deleteMessage().then(ctx.replyWithPhoto({url: urlPhoto})).catch(err => console.log(err))
            break;
        case 'openVideo':
            let urlVideo = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/videos/${query[1]}`
            ctx.deleteMessage().then(ctx.replyWithVideo({url: urlVideo})).catch(err => console.log(err))
            break;
        default:
            console.log('unknown')
            break;
    }
})

bot.launch()

app.get('/', (req, res) => res.send("Hello World!"))

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
