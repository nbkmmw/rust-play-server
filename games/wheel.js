const modeles = require('../modeles').modeles;
const random = require('../wrappers/randomorg');

async function update() {
    modeles.WheelState.findOne({}, async (err, state) => {
        if (err || !state) return;
        if (state.timeToStart == 0) {
            let items = [];

            for (let i = 0; i < 14; i++) {
                let val = await random.getRandomInteger(0, 8);
                switch (Number(val)) {
                    default:
                        items[i] = { color: "grey", coef: 2 }
                        break;
                    case 4:
                        items[i] = { color: "red", coef: 3 }
                        break;
                    case 5:
                        items[i] = { color: "red", coef: 3 }
                        break;
                    case 6:
                        items[i] = { color: "yellow", coef: 5 }
                        break;
                    case 7:
                        items[i] = { color: "yellow", coef: 5 }
                        break;
                    case 8:
                        items[i] = { color: "orange", coef: 20 }
                        break;

                }
            }
            let index = Math.floor(Math.random() * items.length);
            let choosedItem = items[index];

            state.players.forEach(player => {
                if (choosedItem.color == player.Choose) {
                    modeles.User.findOne({ _id: player.User }, async (err, user) => {
                        if (err) return;
                        modeles.User.findOneAndUpdate({ _id: player.User }, { Balance: user.Balance + player.Bet * choosedItem.coef }, {}, () => { });
                    });
                }
            });
            modeles.WheelState.findOneAndUpdate({}, { Items: items, choosedItem: choosedItem, players: [], timeToStart: 15 }, {}, () => { });


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
                Items: [],
                choosedItem: { color: 'none', coef: 0 },
                players: []
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
    modeles.WheelState.findOneAndUpdate({}, {
        $addToSet: {
            players: {
                _id: req.query.userid,
                Bet: req.query.bet,
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

const wheel = {
    getState: getState,
    makeBet: makeBet,
    update: update
};



exports.game = wheel;