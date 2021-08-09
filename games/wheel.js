const modeles = require('../modeles').modeles;
const random = require('../wrappers/randomorg');
const utils = require('../utils');
const crypto = require('crypto')

async function update() {
    modeles.WheelState.findOne({}, async (err, state) => {
        if (err || !state) return;
        if (state.timeToStart == 0) {
            state.players.forEach(player => {
                if (state.choosedItem == player.Choose) {
                    modeles.User.findOne({ _id: player.User }, async (err, user) => {
                        if (err) return;
                        modeles.User.findOneAndUpdate({ _id: player.User }, {
                            Balance: (user.Balance + player.Bet * state.choosedItem).toFixed(2),
                            totalWin: (user.totalWin + player.Bet * choosedItem).toFixed(2)
                        }, {}, () => { });
                    });
                }
            });

            let items = [];
            items.length = 14;

            for (let i = 0; i < 14; i++) {
                let val = random.getRandomInteger(0, 10);
                switch (Number(val)) {
                    default:
                        items[i] = 2
                        break;
                    case 4:
                    case 5:
                    case 6:
                        items[i] = 3
                        break;
                    case 7:
                    case 8:
                    case 9:
                        items[i] = 5
                        break;
                    case 10:
                        items[i] = 50
                        break;

                }
            }
            let choosedItem = items[0];
            modeles.WheelState.findOneAndUpdate({}, {
                Items: items.slice(),
                choosedItem: choosedItem,
                players: [],
                timeToStart: 25,
                Hash: crypto.createHash('sha1').update(Date.now().toString()).digest('hex'),
                Id: state.Id + 1
            }, {}, () => { });
        }
        else {
            modeles.WheelState.findOneAndUpdate({}, { timeToStart: (state.timeToStart - 0.01).toFixed(2) }, {}, () => { });
        }
    });

    setTimeout(update, 10);
}

async function getState(req, res) {
    modeles.WheelState.findOne({}, function (err, state) {
        if (!state) {
            state = new modeles.WheelState({
                timeToStart: 15,
                items: [],
                choosedItem: 0,
                players: [],
                Hash: '',
                Id: 0
            });
            state.save()
            return res.send(state);
        }
        else {
            return res.send(state);
        }
    });
}

async function makeBet(req, res) {
    if (!req.session.user) return res.send({ error: true, message: "no authorized user" })
    modeles.User.findOne({ _id: req.session.user }, (err, user) => {
        if (!(user.Balance - req.query.bet >= 0))
            return res.send({ error: true, message: 'not enough money' })
        modeles.WheelState.findOne({}, (err, state) => {
            if (!utils.containsId(state.players, user._id)) {
                modeles.WheelState.findOneAndUpdate({}, {
                    $addToSet: {
                        players: {
                            _id: user._id,
                            Bet: req.query.bet,
                            Choose: req.query.choose,
                            User: user._id,
                            Username: user.Username,
                            Avatar: user.Avatar
                        }
                    }
                },
                    {},
                    () => { }
                );
                modeles.User.findOneAndUpdate({ _id: user._id }, { Balance: (user.Balance - req.query.bet).toFixed(2), gamesPlayed: user.gamesPlayed + 1 }, {}, () => { });
                return res.send({ error: false })
            }
            return res.send({ error: true, message: 'player with this id already playing' })
        })
    })


}

const wheel = {
    getState: getState,
    makeBet: makeBet,
    update: update
};



exports.game = wheel;