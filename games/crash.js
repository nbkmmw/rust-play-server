const modeles = require('../modeles').modeles;
const random = require('../wrappers/randomorg');

async function addPlayer(req, res) {
    modeles.CrashState.findOneAndUpdate({}, {
        $addToSet: {
            players: {
                _id: req.query.userid,
                Amount: req.query.amount,
                AutoStop: req.query.autostop ?? 0,
                hasAutoStop: req.query.autostop != undefined ? true : false,
                User: req.query.userid
            }
        }
    },
        {},
        () => { }
    );
    modeles.User.findOne({ _id: req.query.userid }, (err, user) => {
        if (err) return res.send({ error: true, message: err });;
        modeles.User.findOneAndUpdate({ _id: req.query.userid }, { Balance: user.Balance - req.query.amount }, {}, () => { });
    });

    res.send();
}

async function getState(req, res) {
    modeles.CrashState.findOne({}, function (err, state) {
        if (!state) {
            state = new modeles.CrashState({
                isRunning: false,
                timeToRun: 5,
                stop_coefficient: 0,
                current_coefficient: 0,
                id: Date.now(),
                players: [],
                history: [],
                runningTime: 0
            });
            state.save()
            return res.send(state);
        }
        else {
            return res.send(state);
        }
    });
}

async function changeMode(req, res) {

}
async function update() {
    modeles.CrashState.findOne({}, async (error, state) => {
        if (error) return res.send({ error: true, message: error });
        if (state && !error) {
            if (!state.isRunning)
                modeles.CrashState.findOneAndUpdate({}, {
                    timeToRun: (state.timeToRun - 0.01) > 0 ? (state.timeToRun - 0.01).toFixed(2) : 5,
                    isRunning: state.timeToRun == 0.01 ? true : false,

                    stop_coefficient: state.timeToRun == 0.01 ? Math.min(
                        Number(await random.getRandomFloat(2, 10)).toFixed(2),
                        Number(await random.getRandomFloat(2, 10)).toFixed(2),
                        Number(await random.getRandomFloat(2, 10)).toFixed(2),
                        Number(await random.getRandomFloat(2, 10)).toFixed(2),
                    ) : state.stop_coefficient,
                    runningTime: 0,
                    current_coefficient: 0
                },
                    {},
                    (err) => {
                        if (!err && state.timeToRun == 5) {
                            state.players.forEach(element => {
                                modeles.User.findOne({ _id: element._id }, (err, player) => {
                                    modeles.CrashState.findOneAndUpdate({}, { $push: { history: { $each: [{ Stop: state.stop_coefficient, Amount: element.Amount, User: element.User, Win: -element.Amount }], $slice: -10 } } }, {}, (err, state) => { });
                                });
                                modeles.CrashState.findOneAndUpdate({}, { players: [] }, {}, (err, state) => { });
                            });
                        }
                        if (err) return res.send({ error: true, message: err });

                    });
            else if (state.isRunning) {
                modeles.CrashState.findOneAndUpdate({}, {
                    runningTime: (state.runningTime + 0.01).toFixed(2),
                    isRunning: state.runningTime == (state.stop_coefficient * 1).toFixed(2) ? false : true,
                    current_coefficient: (state.current_coefficient + 0.01).toFixed(2)
                },
                    {},
                    (err, state) => {

                        if (err) return res.send({ error: true, message: err });
                        state.players.forEach(element => {
                            if (state.current_coefficient == element.AutoStop && element.hasAutoStop)
                                modeles.User.findOne({ _id: element._id }, (err, player) => {
                                    modeles.User.findOneAndUpdate({ _id: element._id }, { Balance: player.Balance + element.Amount * element.AutoStop }, {}, (err, u) => { });
                                    modeles.CrashState.findOneAndUpdate({}, { $push: { history: { $each: [{ Stop: element.Autostop, Amount: element.Amount, User: element.User, Win: element.Amount * element.AutoStop }], $slice: 10 } } }, {}, (err, state) => { });
                                    modeles.CrashState.findOneAndUpdate({}, { $pull: { players: { User: element.User } } }, {}, (err, state) => { });
                                });

                        });

                    });
            }
        }

    });
    setTimeout(update, 10)
}
const crash = {
    addPlayer: addPlayer,
    getState: getState,
    changeMode: changeMode,
    update: update
};
exports.game = crash;