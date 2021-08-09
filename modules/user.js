const modeles = require("../modeles").modeles

async function getMe(req, res) {
    //реализовать
}

async function getBalance(req, res) {
    //реализовать
}

async function setNickname(req, res) {
    if (!req.session.user) return res.send({ error: true, msg: 'no authorized user' })
    modeles.User.findOneAndUpdate({ _id: req.session.user._id }, {
        Username: req.query.new_name
    }, {}, {})
    res.send(200)
}
async function update() {
    modeles.User.find({}, (err, users) => {
        if (err) return
        users.map(user => {
            modeles.User.findOneAndUpdate({ _id: user._id }, {
                isOnline: user.timeToOffline > 0,
                timeToOffline: user.timeToOffline > 0 ? user.timeToOffline - 10 : 0
            }, {}, () => { })
        })
    })
    setTimeout(update, 1000)
}

async function getOnlineCount(req, res) {
    modeles.User.find({}, (err, users) => {
        let online = 0
        users.map(user => {
            if (user.isOnline)
                online++
        })
        return res.send({ count: online })
    })
}

const user = {
    getMe: getMe,
    getBalance: getBalance,
    update: update,
    getOnlineCount: getOnlineCount,
    setUsername: setNickname
}

exports.module = user