const modeles = require('../modeles').modeles;
const random = require('../wrappers/randomorg');
const utils = require('../utils')
const coefficients = {
    'black': 2,
    'red': 2,
    '2-9': 2,
    'ka': 2,
    "jqka": 2,
    'a': 2,
    'joker': 24,
    'hi': 2,
    'lo': 2
}

values = {
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '8': 7,
    '9': 8,
    'k': 9,
    'j': 10,
    'a': 11,
    'q': 12,
    'joker': 13,
};

async function getState(req, res) {
    modeles.HiloState.findOne({}, function (err, state) {
        if (!state) {
            state = new modeles.HiloState({
                timeToNextCard: 5,
                card: {
                    type: 'none',
                    color: 'none'
                },
                players: [],
                history: [],
                players_history: []
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
        modeles.HiloState.findOne({}, (err, state) => {
            if (!utils.containsId(state.players, user._id)) {
                modeles.HiloState.findOneAndUpdate({}, {
                    $addToSet: {
                        players: {
                            _id: req.session.user._id,
                            Bet: req.query.bet,
                            Choose: req.query.choose,
                            User: req.session.user._id
                        }
                    }
                }, {}, () => { }
                );
                modeles.User.findOne({ _id: req.session.user._id }, (err, user) => {
                    if (err || !user) return;
                    modeles.User.findOneAndUpdate({ _id: req.session.user._id }, {
                        Balance: (user.Balance - req.query.bet).toFixed(2),
                        gamesPlayed: user.gamesPlayed + 1
                    }, {}, () => { });
                });
                return res.send({ error: false })
            }
            return res.send({ error: true, message: 'bet already made' })
        })
    })


}

async function update() {
    modeles.HiloState.findOne({}, async (err, state) => {
        if (!state) return;
        if (state.timeToNextCard == 0) {

            let card = {
                _type: await random.getRandomItem("2", "3", "4", "5", "6", "7", "8", "9", "q", "k", "j", "a", "2", "3", "4", "5", "6", "7", "8", "9", "q", "k", "j", "a", "2", "3", "4", "5", "6", "7", "8", "9", "q", "k", "j", "a", "2", "3", "4", "5", "6", "7", "8", "9", "q", "k", "j", "a", "joker"), color: await random.getRandomItem("red", "black")
            };
            state.players.forEach(player => {
                let hilo = values[state.card._type] < values[card._type] ? 'hi' : 'lo';
                let isWinner = false
                if (card._type == player.Choose
                    || card.color == player.Choose
                    || hilo == player.Choose
                    || (card._type >= '2' && card._type <= '9' && player.Choose == '2-9')
                    || (card._type == 'joker' && (player.Choose == "red" || player.Choose == "black"))
                    || ((card._type == 'k'
                        || card._type == 'j'
                        || card._type == 'q'
                        || card._type == 'a')
                        && player.Choose == 'jqka')
                    || ((card._type == 'k'
                        || card._type == 'a')
                        && player.Choose == 'ka')
                ) {
                    isWinner = true
                    modeles.User.findOne({ _id: player.User }, async (err, user) => {
                        if (err) return;
                        modeles.User.findOneAndUpdate({ _id: player.User }, {
                            Balance: (user.Balance + player.Bet * coefficients[player.Choose]).toFixed(2),
                            totalWin: (user.totalWin + player.Bet * coefficients[player.Choose]).toFixed(2)
                        }, {}, () => { });
                    });
                }
                modeles.User.findOne({ _id: player.User }, (err, user) => {
                    modeles.HiloState.findOneAndUpdate({}, {
                        $push: {
                            players_history: {
                                $each: [{
                                    User: player.User,
                                    Bet: player.Bet,
                                    Win: (isWinner ? player.Bet * coefficients[player.Choose] : -player.Bet).toFixed(2),
                                    Choose: player.Choose,
                                    Username: user.Username,
                                    Avatar: user.Avatar
                                }],
                                $slice: -10
                            }
                        }
                    }, {}, () => { })
                })

            });
            coefficients['hi'] = Number(random.getRandomFloat(1, 10)).toFixed(2);

            coefficients['lo'] = Number(random.getRandomFloat(1, 10)).toFixed(2);
            modeles.HiloState.findOneAndUpdate({}, {
                card: card, timeToNextCard: 5, players: [], hi_coef: coefficients['hi'], lo_coef: coefficients['lo'], $push: {
                    history: {
                        $each: [{
                            _type: card._type,
                            color: card.color,
                        }],
                        $slice: -20

                    }
                }
            }, {}, () => { });


        }
        else {
            modeles.HiloState.findOneAndUpdate({}, { timeToNextCard: (state.timeToNextCard - 0.01).toFixed(2) }, {}, () => { });
        }
    });
    setTimeout(update, 10);
}
const hilo = {
    getState: getState,
    makeBet: makeBet,
    update: update
};
exports.game = hilo;