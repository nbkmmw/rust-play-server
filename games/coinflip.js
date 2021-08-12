const modeles = require("../modeles").modeles
const random = require("../wrappers/randomorg")
const utils = require("../utils")

async function update() {
    modeles.CoinflipState.findOne({}, async (err, state) => {
        if (err || !state) return;
        let _rooms = state.rooms.slice()

        _rooms.forEach(async (room, index, object) => {
            if (room.isWaiting) {
                // nop
            }
            else if (room.timeToRun > 0) {
                room.timeToRun--
            }
            else if (room.timeToRun <= 0 && !room.isEnded) {
                room.isEnded = true
                room.timeToClose = 60 * 10 // 10 min

                room.winner = random.getRandomItem([room.firstPlayer.User, room.secondPlayer.User]);

                modeles.User.findOne({ _id: winner }, (err, user) => {

                    let newitems = []

                    for (let i = 0; i < room.bank.items.length; i++) {
                        if (user.items.find(item => item.Name == room.bank.items[i].Name)) {
                            let item = user.items.find(item => item.Name == room.bank.items[i].Name)
                            item.Count += room.bank.items[i].Count
                            newitems.push(item)
                        }
                        else
                            newitems.push(room.bank.items[i])
                    }
                    for (let i = 0; i < user.items.length; i++) {
                        if (!newitems.find(item => item.Name == user.items[i].Name)) {
                            newitems.push(user.items[i])
                        }
                    }

                    modeles.User.findOneAndUpdate({ _id: winner.User }, {
                        items: [...newitems],
                        totalWin: user.totalWin + room.bank.totalPrice
                    }, {}, () => { })
                })
            }
            else if (room.isEnded) {
                if (room.timeToClose <= 0) {
                    room = null;
                    delete _rooms[index]
                }
                else {
                    room.timeToClose--
                }
            }
            if (room)
                _rooms[index] = room;
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
                rooms: [],
                lastid: 0
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
        let room = state.rooms.find(room => room.id == req.query.id)
        if (room)
            return res.send(room);
        return res.send({ error: true, message: 'room not found' })
    })

}

async function createRoom(req, res) {
    if (!req.session.user) return res.send({ error: true, message: "no authorized user" })
    modeles.User.findOne({ _id: req.session.user._id }, (err, u) => {
        if (err || !u) return console.log(`${err}\n${u}`)
        for (let i = 0; i < req.body.items.length; i++) {
            if (u.items.find(item => item.Name == req.body.items[i].Name)) {
                let item = u.items.find(item => item.Name == req.body.items[i].Name)
                if ((item.Count - req.body.items[i].Count) < 0) {
                    return res.send({ error: true, message: "no enough items" })
                }
            }
            else
                return res.send({ error: true, message: "no enough items" })
        }

        modeles.CoinflipState.findOne({}, (err, state) => {
            let roomid = state.lastid + 1;
            modeles.User.findOne({ _id: req.session.user._id }, (err, user) => {
                if (err || !user) return;
                user.gamesPlayed++;
                for (let i = 0; i < req.body.items.length; i++) {
                    let item = req.body.items[i]

                    user.items.forEach((val, index) => {
                        if (val.Name == item.Name) {
                            user.items[i].Count -= item.Count
                            if (user.items[i].Count <= 0)
                                user.items.splice(i, 1)
                        }
                    })
                    modeles.User.findOneAndUpdate({ _id: user._id }, {
                        items: user.items,
                        gamesPlayed: user.gamesPlayed
                    }, {}, () => { })
                }
            });
            let totalPrice = 0, totalCount = 0

            for (let i = 0; i < req.body.items.length; i++) {
                totalCount += req.body.items[i].Count
                totalPrice += req.body.items[i].Price * req.body.items[i].Count
            }
            let room = {
                id: roomid,
                firstPlayer: {
                    _id: req.session.user._id,
                    User: req.session.user._id,
                    Bet: {
                        Count: totalCount,
                        Price: totalPrice,
                        Items: req.body.items
                    },
                    Username: req.session.user.Username,
                    Avatar: req.session.user.Avatar
                },
                secondPlayer: null,
                bank: {
                    totalPrice: totalCount,
                    totalCount: totalPrice,
                    items: req.body.items
                },
                winner: null,
                timeToRun: 60 * 2, // 2 min
                timeToClose: 60 * 10,
                isEnded: false,
                isWaiting: true
            }
            state.rooms.push(room);
            modeles.CoinflipState.findOneAndUpdate({}, {
                rooms: state.rooms
            }, {}, () => { })
        })
    })
}

async function enterRoom(req, res) {
    if (!req.session.user) return res.send({ error: true, message: "no authorized user" })
    modeles.User.findOne({ _id: req.session.user._id }, (err, u) => {
        if (err || !u) return console.log(`${err}\n${u}`)
        for (let i = 0; i < req.body.items.length; i++) {
            if (u.items.find(item => item.Name == req.body.items[i].Name)) {
                let item = u.items.find(item => item.Name == req.body.items[i].Name)
                if ((item.Count - req.body.items[i].Count) < 0) {
                    return res.send({ error: true, message: "no enough items" })
                }
            }
            else
                return res.send({ error: true, message: "no enough items" })
        }

        modeles.CoinflipState.findOne({}, (err, state) => {
            let roomid = req.body.roomid;
            if (!state.rooms[roomid].isWaiting) return res.send({ error: false, msg: 'room not have places' })
            else if (state.rooms[roomid].isEnded) return res.send({ error: false, msg: 'room ended' })
            else if (state.rooms[roomid].firstPlayer.User == req.session.user._id) return res.send({ error: false, msg: 'user already entered to room' })
            modeles.User.findOne({ _id: req.session.user._id }, (err, user) => {
                if (err || !user) return;
                user.gamesPlayed++;
                for (let i = 0; i < req.body.items.length; i++) {
                    let item = req.body.items[i]

                    user.items.forEach((val, index) => {
                        if (val.Name == item.Name) {
                            user.items[i].Count -= item.Count
                            if (user.items[i].Count <= 0)
                                user.items.splice(i, 1)
                        }
                    })
                    modeles.User.findOneAndUpdate({ _id: user._id }, {
                        items: user.items,
                        gamesPlayed: user.gamesPlayed
                    }, {}, () => { })
                }
            });
            let totalPrice = 0, totalCount = 0

            for (let i = 0; i < req.body.items.length; i++) {
                totalCount += req.body.items[i].Count
                totalPrice += req.body.items[i].Price * req.body.items[i].Count
            }
            let room = state.rooms[roomid];
            room.bank.totalCount += totalCount;
            room.bank.totalPrice += totalPrice;
            room.secondPlayer = {
                _id: req.session.user._id,
                User: req.session.user._id,
                Bet: {
                    Count: totalCount,
                    Price: totalPrice,
                    Items: req.body.items
                },
                Username: req.session.user.Username,
                Avatar: req.session.user.Avatar
            };
            room.isWaiting = false;
            let newitems = []

            for (let i = 0; i < req.body.items.length; i++) {
                if (room.bank.items.find(item => item.Name == req.body.items[i].Name)) {
                    let item = room.bank.items.find(item => item.Name == req.body.items[i].Name)
                    item.Count += req.body.items[i].Count
                    newitems.push(item)
                }
                else
                    newitems.push(req.body.items[i])
            }
            for (let i = 0; i < room.bank.items.length; i++) {
                if (!newitems.find(item => item.Name == room.bank.items[i].Name)) {
                    newitems.push(room.bank.items[i])
                }
            }
            room.bank.items = newitems;
            state.rooms[roomid] = room;
            modeles.CoinflipState.findOneAndUpdate({}, {
                rooms: state.rooms
            }, {}, () => { })
        })
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