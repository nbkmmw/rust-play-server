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
    modeles.Chat.findOneAndUpdate({ lang: req.body.lang }, {
        $push: {
            buffer: {
                $each: [{ Sender: req.body.sender, Message: req.body.message }],
                $slice: -50
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