const Queue = require('./models/Queue')
const Room = require('./models/Room')

const { Telegram } = require('telegraf')
const tg = new Telegram(process.env.BOT_TOKEN)

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
                            Queue.deleteOne({user_id: q.user_id}, (err, res) => {
                                if(err) {
                                    console.log('error')
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
                tg.sendMessage(id, 'Teman chat ditemukan')
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
                    tg.sendMessage(userID, 'Kamu sedang berada di Antrian')
                }else {
                    Room.find({participans: userID}, (err, res) => {
                        if(err) {
                            console.log(err)
                        }else {
                            if(res.length > 0) {
                                tg.sendMessage(userID, 'Kamu sedang ada didalam chat')
                            }else {
                                tg.sendMessage(userID, 'Sedang mencari teman...')
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
        Room.findOneAndDelete({participans: userID}, (err, doc, res) => {
            if(err) {
                console.log(err)
            }else {
                if(doc) {
                    let participans = doc.participans
                    participans.forEach(id => {
                        if(userID === id) {
                            tg.sendMessage(userID, 'Telah berhenti dari percakapan')
                        }else {
                            tg.sendMessage(id, 'Temanmu memberhentikan percakapan')
                        }
                        this.find(userID)
                    })
                }else {
                    tg.sendMessage(userID, 'Kamu tidak punya teman chat\n\n/find untuk mencari teman chat')
                }
            }
        }) 
    }

    stop(userID) {
        Room.findOneAndDelete({participans: userID}, (err, doc, res) => {
            if(err) {
                console.log(err)
            }else {
                if(doc) {
                    let participans = doc.participans
                    participans.forEach(id => {
                        if(userID === id) {
                            tg.sendMessage(userID, 'Telah berhenti dari percakapan')
                        }else {
                            tg.sendMessage(id, 'Temanmu memberhentikan percakapan')
                        }
                    })
                }else {
                    tg.sendMessage(userID, 'Kamu tidak punya teman chat\n\n/find untuk mencari teman chat')
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
                            tg.sendMessage(partnerID, data)
                            break;
                        case 'sticker':
                            tg.sendSticker(partnerID, data)
                            break;
                        case 'photo':
                            tg.sendPhoto(partnerID, data)
                            break;
                        case 'voice':
                            tg.sendAudio(partnerID, data)
                            break;
                        case 'video':
                            tg.sendVideo(partnerID, data)
                            break;
                        default:
                            break;
                    }

                }else {
                    tg.sendMessage(userID, 'Kamu tidak punya teman chat\n\n/find untuk mencari teman chat')
                }
            }
        })
    }
}

module.exports = MatchMaker