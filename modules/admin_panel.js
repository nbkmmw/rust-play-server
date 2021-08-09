const modeles = require("../modeles")

async function getUsers(req, res) {
    modeles.User.find({}, (err, users) => {
        return res.send(users)
    })
}
async function ModifyUser(req, res) {
    if (!req.session.user) return res.send({ error: true, message: "no authorized user" })
    if (!req.session.user.isAdmin) return res.send({ error: true, message: "you have not permission to do this" })
    let user_id = req.body.user_id
    let modifyList = req.body.modifyList

    modeles.User.findOneAndUpdate({ Steamid: user_id }, modifyList, {}, (err) => {
        if (err)
            res.send({ error: true, message: err })
        if (!err)
            res.send({ error: false, message: "modify succesfull" })
    })
}

async function ModifyGame(req, res) {
    if (!req.session.user) return res.send({ error: true, message: "no authorized user" })
    if (!req.session.user.isAdmin) return res.send({ error: true, message: "you have not permission to do this" })
    let game = req.body.game
    let modifyList = req.body.modifyList
    switch (game) {
        case "crash":
            modeles.CrashState.findOneAndUpdate({}, modifyList, {}, (err) => {
                if (err)
                    res.send({ error: true, message: err })
                if (!err)
                    res.send({ error: false, message: "modify succesfull" })
            })
            break
        case "hilo":
            modeles.HiloState.findOneAndUpdate({}, modifyList, {}, (err) => {
                if (err)
                    res.send({ error: true, message: err })
                if (!err)
                    res.send({ error: false, message: "modify succesfull" })
            })
            break
        case "coinflip":
            modeles.CoinflipState.findOneAndUpdate({}, modifyList, {}, (err) => {
                if (err)
                    res.send({ error: true, message: err })
                if (!err)
                    res.send({ error: false, message: "modify succesfull" })
            })
            break
        case "wheel":
            modeles.WheelState.findOneAndUpdate({}, modifyList, {}, (err) => {
                if (err)
                    res.send({ error: true, message: err })
                if (!err)
                    res.send({ error: false, message: "modify succesfull" })
            })
            break
        case "jackpot":
            modeles.JackpotState.findOneAndUpdate({}, modifyList, {}, (err) => {
                if (err)
                    res.send({ error: true, message: err })
                if (!err)
                    res.send({ error: false, message: "modify succesfull" })
            })
            break

    }
}

const admin_panel = {
    ModifyUser: ModifyUser,
    ModifyGame: ModifyGame,
    getUsers: getUsers
}
exports.module = admin_panel