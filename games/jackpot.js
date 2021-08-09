const modeles = require("../modeles").modeles
const random = require("../wrappers/randomorg")
const utils = require("../utils")

async function update() {

    modeles.JackpotState.findOne({}, (err, state) => {

        if (err || !state) return;
        if (state.players.length > 1 && state.isWaiting && !state.isRunning) {
            modeles.JackpotState.findOneAndUpdate({}, { isWaiting: false, timeToStart: 20 }, {}, () => { })
        }
        if (state.isRunning) {
            if (state.runningTime <= 0) {
                modeles.JackpotState.findOneAndUpdate({}, {
                    lastGame: {
                        id: state.id,
                        players: state.players
                    },
                    bank: {
                        totalPrice: 0,
                        totalCount: 0,
                        items: 0
                    },
                    players: [],
                    id: state.id + 1,
                    timeToStart: 20,
                    isWaiting: true,
                    isRunning: false
                }, {}, () => { })

            }
            else
                modeles.JackpotState.findOneAndUpdate({}, { runningTime: (state.runningTime - 0.01).toFixed(2) }, {}, () => { })
        }
        if (!state.isWaiting && state.timeToStart == 0 && !state.isRunning) {
            let chances = []
            let lastChance = 0;
            for (let i = 0; i < state.players.length; i++) {
                let player = state.players[i]

                for (let j = lastChance; j < lastChance + Number(player.Chance.toFixed()); j++) {
                    chances[j] = player
                }

                lastChance += Number(player.Chance.toFixed())
            }

            let randint = random.getRandomInteger(0, 99)
            let winner = chances[randint]
            console.log(winner)
            modeles.User.findOne({ _id: winner._id }, (err, user) => {

                let newitems = []

                for (let i = 0; i < state.bank.items.length; i++) {
                    if (user.items.find(item => item.Name == state.bank.items[i].Name)) {
                        let item = user.items.find(item => item.Name == state.bank.items[i].Name)
                        item.Count += state.bank.items[i].Count
                        newitems.push(item)
                    }
                    else
                        newitems.push(state.bank.items[i])
                }
                for (let i = 0; i < user.items.length; i++) {
                    if (!newitems.find(item => item.Name == user.items[i].Name)) {
                        newitems.push(user.items[i])
                    }
                }

                modeles.User.findOneAndUpdate({ _id: winner.User }, {
                    items: [...newitems],
                    totalWin: user.totalWin + state.bank.totalPrice
                }, {}, () => { })
            })
            modeles.JackpotState.findOneAndUpdate({}, {
                winner: winner,
                isWaiting: false,
                isRunning: true,
                runningTime: 5,
            }, {}, (err) => { if (err) console.log(err) })
        }
        else if (state.timeToStart > 0) {

            if (!state.isWaiting) {
                modeles.JackpotState.findOneAndUpdate({}, {
                    timeToStart: (Number(state.timeToStart) - 0.01).toFixed(2)
                }, {}, () => { console.timeLog('log', state.timeToStart) })

            }

        }

    })
    setTimeout(update, 10)

}

async function getState(req, res) {
    modeles.JackpotState.findOne({}, (err, state) => {
        if (!state) {
            let st = new modeles.JackpotState({
                isRunning: false,
                runningTime: 5,
                isWaiting: true,
                timeToStart: 20,
                bank: {
                    totalCount: 0,
                    totalPrice: 0,
                    items: []
                },
                players: [],
                winner: {
                    _id: '',
                    User: '',
                    Avatar: '',
                    Username: '',
                    Bet: {
                        Count: 0,
                        Price: 0,
                        Items: []
                    },
                    Chance: 0
                },
                lastGame: {
                    players: [],
                    id: 0
                },
                id: 0
            })
            st.save()
            return res.send(st)
        }
        else
            return res.send(state)
    })
}

async function makeBet(req, res) {
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

        modeles.JackpotState.findOne({}, (err, state) => {

            if (!utils.containsId(state.players, req.session.user._id)) {


                let totalPrice = 0, totalCount = 0

                for (let i = 0; i < req.body.items.length; i++) {
                    totalCount += req.body.items[i].Count
                    totalPrice += req.body.items[i].Price * req.body.items[i].Count
                }
                modeles.JackpotState.findOneAndUpdate({}, {
                    $addToSet: {
                        players: {
                            _id: req.session.user._id,
                            Bet: {
                                Items: req.body.items,
                                Count: totalCount,
                                Price: totalPrice
                            },
                            Chance: 0,
                            User: req.session.user._id,
                            Username: req.session.user.Username,
                            Avatar: req.session.user.Avatar
                        }
                    },
                    $inc: {
                        'bank.totalPrice': totalPrice,
                        'bank.totalCount': totalCount,
                    },
                },
                    {},
                    (err) => { if (err) console.log(err) }
                );
                let newitems = []

                for (let i = 0; i < req.body.items.length; i++) {
                    if (state.bank.items.find(item => item.Name == req.body.items[i].Name)) {
                        let item = state.bank.items.find(item => item.Name == req.body.items[i].Name)
                        item.Count += req.body.items[i].Count
                        newitems.push(item)
                    }
                    else
                        newitems.push(req.body.items[i])
                }
                for (let i = 0; i < state.bank.items.length; i++) {
                    if (!newitems.find(item => item.Name == state.bank.items[i].Name)) {
                        newitems.push(state.bank.items[i])
                    }
                }

                modeles.JackpotState.findOneAndUpdate({},
                    {
                        'bank.items': [...newitems]
                    }, {}, (err) => { if (err) console.log(err) })

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
                setTimeout(() => {
                    modeles.JackpotState.findOne({}, (err, state) => {
                        state.players.forEach(player => {
                            const chance = ((player.Bet.Price / state.bank.totalPrice) * 100).toFixed(2)
                            modeles.JackpotState.findOneAndUpdate({ 'players.User': player.User }, {
                                'players.$.Chance': chance
                            }, {}, () => { })
                        })
                    })

                }, 200)
            }
        })
    })
}
const jackpot = {
    update: update,
    getState: getState,
    makeBet: makeBet
}

exports.game = jackpot