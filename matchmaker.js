const Queue = require('./models/Queue')
const Room = require('./models/Room')

const { Telegram } = require('telegraf')
const tg = new Telegram(process.env.BOT_TOKEN)

const { Markup } = require('telegraf')

const text = require(`./config/lang/${process.env.LANGUAGE}`)

class MatchMaker {
    init() {
        setInterval(() => {
            Queue.find({}, (err, queues) => {
                if(err) {
                    console.log(err)
                } else {
                    if(queues.length == 2) {
                        let newParticipan = [];
                        queues.map(q => {
                            Queue.deleteOne({user_id: q.user_id}, (err) => {
                                if(err) {
                                    console.log(text.ERROR)
                                }
                            })
                            newParticipan.push(q.user_id)
                        })
                        this.createRoom(newParticipan)
                    }
                }
            }).limit(2)
        }, 2000);
    }

    createRoom(newParticipan) {
        let room = new Room({
            participans: newParticipan,
        });
        
        room.save(function(err, data) {
            if(err) return console.error(err)

            newParticipan.forEach(id => {
                tg.sendMessage(id, text.CREATE_ROOM.SUCCESS_1)
            });
            console.log(data)
        });
    }

    find(userID) {
        Queue.find({user_id: userID}, (err, res) => {
            if(err) {
                console.log(err)
            }else {
                if(res.length > 0) {
                    tg.sendMessage(userID, text.FIND.WARNING_1)
                }else {
                    Room.find({participans: userID}, (err, res) => {
                        if(err) {
                            console.log(err)
                        }else {
                            if(res.length > 0) {
                                tg.sendMessage(userID, text.FIND.WARNING_2)
                            }else {
                                tg.sendMessage(userID, text.FIND.LOADING)
                                let queue = new Queue({
                                    user_id: userID
                                });
                                
                                queue.save(function(err, data) {
                                    if(err) return console.error(err)
                                    console.log(data)
                                });
                            }
                        }
                    })
                }
            }
        }) 
    }

    next(userID) {
        Room.findOneAndDelete({participans: userID}, (err, doc) => {
            if(err) {
                console.log(err)
            }else {
                if(doc) {
                    let participans = doc.participans
                    participans.forEach(id => {
                        if(userID === id) {
                            tg.sendMessage(userID, text.NEXT.SUCCESS_1)
                            this.find(userID)
                        }else {
                            tg.sendMessage(id, text.NEXT.SUCCESS_2)
                        }
                    })
                }else {
                    tg.sendMessage(userID, text.NEXT.WARNING_1)
                }
            }
        }) 
    }

    stop(userID) {
        Room.findOneAndDelete({participans: userID}, (err, doc) => {
            if(err) {
                console.log(err)
            }else {
                if(doc) {
                    let participans = doc.participans
                    participans.forEach(id => {
                        if(userID === id) {
                            tg.sendMessage(userID, text.STOP.SUCCESS_1)
                        }else {
                            tg.sendMessage(id, text.STOP.SUCCESS_2)
                        }
                    })
                }else {
                    tg.sendMessage(userID, text.STOP.WARNING_1)
                }
            }
        })
    }

    exit(userID) {
        Queue.findOneAndDelete({user_id: userID}, (err, doc) => {
            if(err) {
                console.log(err)
            }else {
                if(doc != null) {
                    tg.sendMessage(userID, text.EXIT.SUCCESS_1)
                }else {
                    tg.sendMessage(userID, text.EXIT.WARNING_1)
                }
            }
        }) 
    }

    connect(userID, [type, data]) {
        Room.find({participans: userID}, (err, res) => {
            if(err) {
                console.log(err)
            }else {
                if(res.length > 0) {
                    let participans = res[0].participans
                    let index = participans.indexOf(userID)
                    let partnerID = participans[index == 1 ? 0 : 1]

                    switch (type) {
                        case 'text':
                            data.reply_to_message ? 
                                this.#sendReply(partnerID, userID, data.text, data, 'sendMessage') : 
                                tg.sendMessage(partnerID, data.text)
                            break;
                        case 'sticker':
                            data.reply_to_message ?
                                this.#sendReply(partnerID, userID, data.sticker.file_id, data, 'sendSticker')  :
                                tg.sendSticker(partnerID, data.sticker.file_id)
                            break;
                        case 'voice':
                            data.reply_to_message ?
                                this.#sendReply(partnerID, userID, data.voice.file_id, data, 'sendVoice') :
                                tg.sendVoice(partnerID, data.voice.file_id)
                            break;
                        case 'photo':
                            tg.getFileLink(data)
                                .then(url => {
                                    let photoName = url.pathname.split('/photos/')[1]
                                    tg.sendMessage(partnerID, text.USER_SEND_PHOTO.WARNING_1, 
                                        Markup.inlineKeyboard([
                                            [Markup.button.callback('Buka', 'openPhoto-'+String(photoName))],
                                        ])
                                    )
                                })
                            break;
                        case 'video':
                             tg.getFileLink(data)
                                .then(url => {
                                    let photoName = url.pathname.split('/videos/')[1]
                                    tg.sendMessage(partnerID, text.USER_SEND_VIDEO.WARNING_1, 
                                        Markup.inlineKeyboard([
                                            [Markup.button.callback('Buka', 'openVideo-'+String(photoName))],
                                        ])
                                    )
                                })
                            break;
                        default:
                            break;
                    }

                }else {
                    tg.sendMessage(userID, text.CONNECT.WARNING_1)
                }
            }
        })
    }

    #sendReply(partnerID, userID, dataToSend, dataReply, type) {
        let {photo, video, message_id, from: {id} } = dataReply.reply_to_message

        let number = photo || video ? 2 : 1
        let replyToPlus =  { reply_to_message_id : message_id + number }
        let replyToMinus =  { reply_to_message_id : message_id - number }

        id == userID ? 
            tg[type](partnerID, dataToSend, replyToPlus) : 
            tg[type](partnerID, dataToSend, replyToMinus)
    }

}

module.exports = MatchMaker