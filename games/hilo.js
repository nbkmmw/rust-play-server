const modeles = require('../modeles').modeles;
const random = require('../wrappers/randomorg');

const coefficients = {
    'black': 2,
    'white': 2,
    '2-9': 2,
    'k': 2,
    'j': 2,
    'a': 2,
    'q': 2,
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
                history: []
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
    modeles.HiloState.findOneAndUpdate({}, {
        $addToSet: {
            players: {
                _id: req.query.userid,
                Amount: req.query.bet,
                AutoStop: req.query.choose,
                User: req.query.userid
            }
        }
    },
        {},
        () => { }
    );
    modeles.User.findOne({ _id: req.query.userid }, (err, user) => {
        if (err || !user) return;
        modeles.User.findOneAndUpdate({ _id: req.query.userid }, { Balance: user.Balance - req.query.bet }, {}, () => { });
    });

}

async function update() {
    modeles.HiloState.findOne({}, async (err, state) => {
        if (err) return res.send({ error: true, message: err });
        if (!state) return;
        if (state.timeToNextCard == 0) {

            let card = {
                _type: await random.getRandomItem("2", "3", "4", "5", "6", "7", "8", "9", "q", "k", "j", "a", "2", "3", "4", "5", "6", "7", "8", "9", "q", "k", "j", "a", "2", "3", "4", "5", "6", "7", "8", "9", "q", "k", "j", "a", "2", "3", "4", "5", "6", "7", "8", "9", "q", "k", "j", "a", "joker"), color: await random.getRandomItem("white", "black")
            };
            state.players.forEach(player => {
                let hilo = values[state.card._type] < values[card._type] ? 'hi' : 'lo';
                if (card._type == player.Choose || card.color == player.Choose || hilo == player.Choose || (card._type >= '2' && card._type <= '9' && player.Choose == '2-9')) {
                    modeles.User.findOne({ _id: player.User }, async (err, user) => {
                        if (err) return res.send({ error: true, message: err });
                        modeles.User.findOneAndUpdate({ _id: player.User }, { Balance: user.Balance + player.Bet * coefficients[player.Choose] }, {}, () => { });
                    });
                }
            });

            modeles.HiloState.findOneAndUpdate({}, {
                card: card, timeToNextCard: 5, players: [], $push: {
                    history: {
                        $each: [{
                            _type: card._type,
                            color: card.color,
                        }],
                        $slice: -20

                    }
                }
            }, {}, () => { });
            coefficients['hi'] = Number(await random.getRandomFloat(2, 10));

            coefficients['lo'] = Number(await random.getRandomFloat(2, 10));

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