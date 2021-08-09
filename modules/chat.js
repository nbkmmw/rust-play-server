const modeles = require('../modeles').modeles;

async function getMessages(req, res) {
    modeles.Chat.findOne({ lang: req.query.lang }, async (err, state) => {
        if (!state) {
            let chat = new modeles.Chat({ lang: req.query.lang, buffer: [] });
            chat.save();
            return res.send(chat.buffer);
        }
        else if (!err) {
            return res.send(state.buffer);
        }
    });
}

async function sendMessage(req, res) {
    if (!req.body.lang || !req.body.username || !req.body.avatar || !req.body.message) return res.send({ error: true, message: "incorrect data" })
    let time_raw = new Date(Date.now())
    let time = time_raw.getHours().toString().padStart(2, "0") + ":" + time_raw.getMinutes().toString().padStart(2, "0")
    modeles.Chat.findOneAndUpdate({ lang: req.body.lang }, {
        $push: {
            buffer: {
                $each: [{ username: req.body.username, avatar: req.body.avatar, message: req.body.message, time: time }],
                $slice: -30
            }
        }
    }, {}, async (err, chat) => {
        if (!err) return res.send({ error: false });
        if (err) return res.send({ error: true, message: err });
    });
}
const chat = {
    getMessages: getMessages,
    sendMessage: sendMessage
};

exports.module = chat;