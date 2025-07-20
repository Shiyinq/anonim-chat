const Queue = require('../models/Queue')
const Room = require('../models/Room')

const { Telegram } = require('telegraf')
const tg = new Telegram(process.env.BOT_TOKEN)

const { Markup } = require('telegraf')
const i18n = require('../i18n/i18n')

class MatchMaker {
    constructor() {
        this.text = i18n.getLocale()
    }

    init() {
        setInterval(() => {
            Queue.find({}, async (err, queues) => {
                if (err) {
                    console.log(err)
                } else {
                    while (queues.length >= 2) {
                        let pair = queues.splice(0, 2)
                        let userIds = pair.map(q => q.user_id)
                        
                        await Promise.all(userIds.map(id => Queue.deleteOne({ user_id: id })))
                        
                        const alreadyInRoom = await Promise.all(userIds.map(id => Room.findOne({ participans: id })))
                        if (alreadyInRoom.some(r => r)) {
                            continue
                        }
                        
                        this.createRoom(userIds)
                    }
                }
            })
        }, 2000);
    }

    async createRoom(newParticipan) {
        try {
            let room = new Room({ participans: newParticipan });
            await room.save();
            for (const id of newParticipan) {
                await tg.sendMessage(id, this.text.CREATE_ROOM.SUCCESS_1);
            }
        } catch (err) {
            console.error(err);
            for (const id of newParticipan) {
                await tg.sendMessage(id, this.text.ERROR);
            }
        }
    }

    async find(userID) {
        try {
            const queueRes = await Queue.find({ user_id: userID })
            if (queueRes.length > 0) {
                await tg.sendMessage(userID, this.text.FIND.WARNING_1)
                return
            }
            const roomRes = await Room.find({ participans: userID })
            if (roomRes.length > 0) {
                await tg.sendMessage(userID, this.text.FIND.WARNING_2)
                return
            }
            await tg.sendMessage(userID, this.text.FIND.LOADING)
            const doubleCheck = await Queue.find({ user_id: userID })
            if (doubleCheck.length === 0) {
                const queue = new Queue({ user_id: userID })
                await queue.save()
            }
        } catch (err) {
            console.error(err)
            await tg.sendMessage(userID, this.text.ERROR)
        }
    }

    async next(userID) {
        try {
            const doc = await Room.findOneAndDelete({ participans: userID });
            if (doc) {
                let participans = doc.participans;
                for (const id of participans) {
                    if (userID === id) {
                        await tg.sendMessage(userID, this.text.NEXT.SUCCESS_1);
                        await this.find(userID);
                    } else {
                        await tg.sendMessage(id, this.text.NEXT.SUCCESS_2);
                    }
                }
            } else {
                await tg.sendMessage(userID, this.text.NEXT.WARNING_1);
            }
        } catch (err) {
            console.error(err);
            await tg.sendMessage(userID, this.text.ERROR);
        }
    }

    async stop(userID) {
        try {
            const doc = await Room.findOneAndDelete({ participans: userID });
            if (doc) {
                let participans = doc.participans;
                for (const id of participans) {
                    if (userID === id) {
                        await tg.sendMessage(userID, this.text.STOP.SUCCESS_1);
                    } else {
                        await tg.sendMessage(id, this.text.STOP.SUCCESS_2);
                    }
                }
            } else {
                await tg.sendMessage(userID, this.text.STOP.WARNING_1);
            }
        } catch (err) {
            console.error(err);
            await tg.sendMessage(userID, this.text.ERROR);
        }
    }

    async exit(userID) {
        try {
            const doc = await Queue.findOneAndDelete({ user_id: userID });
            if (doc != null) {
                await tg.sendMessage(userID, this.text.EXIT.SUCCESS_1);
            } else {
                await tg.sendMessage(userID, this.text.EXIT.WARNING_1);
            }
        } catch (err) {
            console.error(err);
            await tg.sendMessage(userID, this.text.ERROR);
        }
    }

    async connect(userID, [type, data]) {
        try {
            const res = await Room.find({ participans: userID });
            if (res.length > 0) {
                let participans = res[0].participans;
                let index = participans.indexOf(userID);
                let partnerID = participans[index == 1 ? 0 : 1];

                switch (type) {
                    case 'text':
                        if (data.reply_to_message) {
                            try {
                                await this.#sendReply(partnerID, userID, data.text, data, 'sendMessage');
                            } catch (err) {
                                await this.#errorWhenRoomActive(err, userID);
                            }
                        } else {
                            try {
                                await tg.sendMessage(partnerID, data.text);
                            } catch (err) {
                                await this.#errorWhenRoomActive(err, userID);
                            }
                        }
                        break;
                    case 'sticker':
                        if (data.reply_to_message) {
                            try {
                                await this.#sendReply(partnerID, userID, data.sticker.file_id, data, 'sendSticker');
                            } catch (err) {
                                await this.#errorWhenRoomActive(err, userID);
                            }
                        } else {
                            try {
                                await tg.sendSticker(partnerID, data.sticker.file_id);
                            } catch (err) {
                                await this.#errorWhenRoomActive(err, userID);
                            }
                        }
                        break;
                    case 'voice':
                        if (data.reply_to_message) {
                            try {
                                await this.#sendReply(partnerID, userID, data.voice.file_id, data, 'sendVoice');
                            } catch (err) {
                                await this.#errorWhenRoomActive(err, userID);
                            }
                        } else {
                            try {
                                await tg.sendVoice(partnerID, data.voice.file_id);
                            } catch (err) {
                                await this.#errorWhenRoomActive(err, userID);
                            }
                        }
                        break;
                    case 'photo':
                        try {
                            const url = await tg.getFileLink(data);
                            let photoName = url.pathname.split('/photos/')[1];
                            await tg.sendMessage(partnerID, this.text.USER_SEND_PHOTO.WARNING_1,
                                Markup.inlineKeyboard([
                                    [Markup.button.callback(this.text.USER_SEND_PHOTO.BUTTON, 'openPhoto-' + String(photoName))],
                                ])
                            );
                        } catch (err) {
                            await this.#errorWhenRoomActive(err, userID);
                        }
                        break;
                    case 'video':
                        try {
                            const url = await tg.getFileLink(data);
                            let photoName = url.pathname.split('/videos/')[1];
                            await tg.sendMessage(partnerID, this.text.USER_SEND_VIDEO.WARNING_1,
                                Markup.inlineKeyboard([
                                    [Markup.button.callback(this.text.USER_SEND_VIDEO.BUTTON, 'openVideo-' + String(photoName))],
                                ])
                            );
                        } catch (err) {
                            await this.#errorWhenRoomActive(err, userID);
                        }
                        break;
                    default:
                        break;
                }
            } else {
                await tg.sendMessage(userID, this.text.CONNECT.WARNING_1);
            }
        } catch (err) {
            console.error(err);
            await tg.sendMessage(userID, this.text.ERROR);
        }
    }

    async currentActiveUser(userID) {
        let totalUserInRoom = await Room.countDocuments() * 2
        let totalUserInQueue = await Queue.countDocuments()
        let totalUser = totalUserInRoom + totalUserInQueue
        let textAactiveUser = this.text.ACTIVE_USER
            .replace('${totalUser}', totalUser)
            .replace('${totalUserInQueue}', totalUserInQueue)
            .replace('${totalUserInRoom}', totalUserInRoom)

        tg.sendMessage(userID, textAactiveUser)
    }

    async #forceStop(userID) {
        try {
            const doc = await Room.findOneAndDelete({ participans: userID });
            if (doc) {
                let participans = doc.participans;
                for (const id of participans) {
                    if (userID === id) {
                        await tg.sendMessage(userID, this.text.STOP.SUCCESS_2);
                    }
                }
            }
        } catch (err) {
            console.error(err);
            await tg.sendMessage(userID, this.text.ERROR);
        }
    }

    async #errorWhenRoomActive({response, on}, userID) {
        console.log(response, on)
        switch (response.error_code) {
            case 403:
                await this.#forceStop(userID)
                break;
            default:
                break;
        }
    }

    async #sendReply(partnerID, userID, dataToSend, dataReply, type) {
        let {photo, video, message_id, from: {id} } = dataReply.reply_to_message

        let number = photo || video ? 2 : 1
        let replyToPlus =  { reply_to_message_id : message_id + number }
        let replyToMinus =  { reply_to_message_id : message_id - number }

        if (id == userID) {
            await tg[type](partnerID, dataToSend, replyToPlus)
        } else {
            await tg[type](partnerID, dataToSend, replyToMinus)
        }
    }

}

module.exports = MatchMaker