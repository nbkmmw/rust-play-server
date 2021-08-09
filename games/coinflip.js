const modeles = require("../modeles").modeles
const random = require("../wrappers/randomorg")
const utils = require("../utils")

async function update() {
    modeles.CoinflipState.findOne({}, async (err, state) => {
        if (err || !state) return;
        let _rooms = state.rooms.slice()

        _rooms.forEach(async (room, index, object) => {
            if (!room.isWaiting && !room.isEnded) {
                if (room.timeToRun.toFixed(2) > 0) {
                    object[index].timeToRun -= 0.1
                }
                if (room.timeToRun.toFixed(2) == 0 && !room.isEnded) {
                    object[index].winner = await random.getRandomItem(room.firstPlayer, room.secondPlayer)
                    object[index].isEnded = true

                    modeles.User.findOneAndUpdate({ _id: object[index].winner }, {
                        $inc: {
                            Balance: room.bank,
                            totalWin: room.bank
                        }
                    },
                        {},
                        () => { })

                }
                if (room.isEnded) {
                    if (room.timeToClose > 0) {
                        object[index].timeToClose -= 0.1
                    }
                    else {
                        object.splice(index, 1)
                    }
                }

            }
        })

        modeles.CoinflipState.findOneAndUpdate(
            {},
            {
                rooms: _rooms
            },
            {},
            () => { }
        )
    })
    setTimeout(update, 10)
}

async function getState(req, res) {
    modeles.CoinflipState.findOne({}, (err, state) => {
        if (!state) {
            const st = new modeles.CoinflipState({
                rooms: []
            })
            st.save()
            return res.send(st)
        }
        else {
            return res.send(state)
        }
    })
}

async function getRoom(req, res) {

    modeles.CoinflipState.findOne({}, (err, state) => {
        state.rooms.forEach(room => {
            if (room.id == req.query.id)
                return res.send(room)
        })
        return res.send({ error: true, message: 'room not found' })
    })

}

async function createRoom(req, res) {
    if (req.session.user) return res.send({ error: true, message: 'not authorized user' })
    modeles.User.findOne({ _id: req.session.user._id }, (err, user) => {
        if (user.Balance - req.query.bet < 0) return res.send({ error: true, message: 'no enough money' })
        modeles.User.finOneAndUpdate(
            { _id: req.session.user._id },
            {
                Balance: user.Balance - req.query.bet,
                gamesPlayed: user.gamesPlayed + 1
            },
            {},
            () => { }
        )
    })

    modeles.CoinflipState.findOne({}, (err, state) => {
        let rooms = state.rooms.slice()
        rooms.sort((first, second) => {
            if (first.id > second.id)
                return 1
            if (first.id < second.id)
                return -1
            return 0
        })
        const id = rooms[rooms.length - 1].id + 1
        modeles.CoinflipState.findOneAndUpdate({}, {
            $push: {
                rooms: {
                    id: id,
                    firstPlayer: req.session.user._id,
                    secondPlayer: null,
                    isWaiting: true,
                    bank: req.query.bet,
                    winner: null,
                    timeToRun: 20,
                    timeToClose: 60 * 15, // комната будет удалена через 15 минут после окончания
                    isEnded: false
                }
            }
        },
            {},
            () => { })
    })
}

async function enterRoom(req, res) {
    if (req.session.user) return res.send({ error: true, message: 'not authorized user' })
    modeles.User.findOne({ _id: req.session.user._id }, (err, user) => {
        if (user.Balance - req.query.bet < 0) return res.send({ error: true, message: 'no enough money' })
        modeles.User.finOneAndUpdate(
            { _id: req.session.user._id },
            {
                Balance: user.Balance - req.query.bet,
                gamesPlayed: user.gamesPlayed + 1
            },
            {},
            () => { }
        )
    })

    modeles.CoinflipState.findOne({}, (err, state) => {
        modeles.CoinflipState.update({ 'rooms.id': req.query.id }, {
            $set: {
                'rooms.$': {
                    secondPlayer: req.session.user._id,
                    isWaiting: false,
                    $inc: { bank: req.query.bet },
                    winner: null,
                    timeToRun: 20,
                    timeToClose: 60 * 15, // комната будет удалена через 15 минут после окончания
                    isEnded: false
                }
            }
        },
            {},
            () => { })
    })
}

const coinflip = {
    update: update,
    getState: getState,
    getRoom: getRoom,
    createRoom: createRoom,
    enterRoom: enterRoom
}

exports.game = coinflip