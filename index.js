require('dotenv').config()
require('./config/database')

const express = require('express')
const app = express()
const port = 3000

const { Telegraf} = require('telegraf')
const bot = new Telegraf(process.env.BOT_TOKEN)

const MatchMaker = require('./matchmaker')
let Matchmaker = new MatchMaker()

Matchmaker.init()

bot.start((ctx) => {
    ctx.reply('Selamat Datang di Anonim Chat\n\n/find untuk mencari teman chat\n/next berhenti dari chat dan mencari teman lain\n/stop berhenti dari chat\n/exit keluar dari antrian')
})

bot.command('help', (ctx) => {
    ctx.reply('/find untuk mencari teman chat\n/next berhenti dari chat dan mencari teman lain\n/stop berhenti dari chat\n/exit keluar dari antrian')
})

bot.command('ping', (ctx) => {
    const start = new Date()
    const s = start / 1000 - ctx.message.date
    ctx.replyWithHTML(`Pong 🏓 - <code>⏱ ${s.toFixed(3)} s</code>`)
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
    let photoID = ctx.message.photo[0].file_id
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

app.get('/', (req, res) => {
    res.send('Hello World!')
})

bot.launch()

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
