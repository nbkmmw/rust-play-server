const modeles = require('../modeles').modeles;
const random = require('../wrappers/randomorg');
const utils = require('../utils')
async function addPlayer(req, res) {
    if (!req.session.user) return res.send({ error: true, message: "no authorized user" })
    modeles.CrashState.findOne({}, (err, state) => {
        if (state.isRunning)
            return res.send({ error: true, message: 'game already running' })
        if (!utils.containsId(state.players, req.session.user._id)) {
            modeles.User.findOne({ _id: req.session.user._id }, (err, user) => {
                if (err) return res.send({ error: true, message: err });;
                if (user.Balance - req.query.amount < 0) return res.send({ error: true, message: "not enough money" })

                modeles.CrashState.findOneAndUpdate({}, {
                    $addToSet: {
                        players: {
                            _id: req.session.user._id,
                            Amount: req.query.amount,
                            AutoStop: req.query.autostop ?? 0,
                            hasAutoStop: req.query.autostop != undefined ? true : false,
                            User: req.session.user._id
                        }
                    }
                },
                    {},
                    () => { }
                );

                modeles.User.findOneAndUpdate({ _id: req.session.user._id }, {
                    Balance: (user.Balance - req.query.amount).toFixed(2),
                    gamesPlayed: user.gamesPlayed + 1
                }, {}, () => { });
            });
            res.send({ error: false, message: "succesful" });
        }
    })

}

async function getState(req, res) {
    modeles.CrashState.findOne({}, function (err, state) {
        if (!state) {
            state = new modeles.CrashState({
                isRunning: false,
                timeToRun: 5,
                stop_coefficient: 0,
                current_coefficient: 0,
                id: 0,
                players: [],
                history: [],
                runningTime: 0,
                win_coef: 50,
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
        if (state && !error) {
            let nums = []
            if (state.timeToRun == 0.01) {
                for (let i = 0; i < (state.win_coef / 10); i++)
                    nums[i] = random.getRandomFloat(1, 30)
            }
            if (!state.isRunning) {
                modeles.CrashState.findOneAndUpdate({}, {
                    timeToRun: (state.timeToRun - 0.01) > 0 ? (state.timeToRun - 0.01).toFixed(2) : 5,
                    isRunning: state.timeToRun == 0.01 ? true : false,

                    stop_coefficient: state.timeToRun == 0.01 ? Math.min(...nums) : state.stop_coefficient,
                    runningTime: 0,
                    current_coefficient: 0,
                    id: state.timeToRun == 0.01 ? state.id + 1 : state.id
                },
                    {},
                    (err) => {
                        if (!err && state.timeToRun == 5) {
                            state.players.forEach(element => {
                                modeles.User.findOne({ _id: element._id }, (err, player) => {
                                    modeles.CrashState.findOneAndUpdate({}, {
                                        $push: {
                                            history: {
                                                $each: [
                                                    {
                                                        Stop: state.stop_coefficient.toFixed(2),
                                                        Amount: element.Amount,
                                                        User: element.User,
                                                        Win: -element.Amount,
                                                        Username: player.Username,
                                                        Avatar: player.Avatar
                                                    }
                                                ],
                                                $slice: -10
                                            }
                                        }
                                    }, {}, (err, state) => { });
                                });
                            });
                            modeles.CrashState.findOneAndUpdate({}, { players: [] }, {}, (err, state) => { });
                        }
                        if (err) return console.log(err)

                    });
            }
            else if (state.isRunning) {
                modeles.CrashState.findOneAndUpdate({}, {
                    runningTime: (state.runningTime + 0.01).toFixed(2),
                    isRunning: state.current_coefficient == (state.stop_coefficient * 1).toFixed(2) ? false : true,
                    current_coefficient: state.current_coefficient == 0 ? 1 : (state.current_coefficient + 0.01).toFixed(2),

                },
                    {},
                    (err, state) => {

                        if (err) return console.log(err)
                        state.players.forEach(element => {
                            if (state.current_coefficient == element.AutoStop && element.hasAutoStop)
                                modeles.User.findOne({ _id: element._id }, (err, player) => {
                                    modeles.User.findOneAndUpdate({ _id: element._id },
                                        {
                                            Balance: (player.Balance + element.Amount * element.AutoStop).toFixed(2),
                                            totalWin: (player.totalWin + element.Amount * element.AutoStop).toFixed(2)
                                        },
                                        {},
                                        (err, u) => {
                                            modeles.CrashState.findOneAndUpdate({}, {
                                                $push: {
                                                    history: {
                                                        $each:
                                                            [{
                                                                Stop: element.AutoStop,
                                                                Amount: element.Amount,
                                                                User: element.User,
                                                                Win: (element.Amount * element.AutoStop).toFixed(2),
                                                                Username: u.Username,
                                                                Avatar: u.Avatar
                                                            }],
                                                        $slice: -10
                                                    }
                                                }
                                            }, {}, (err, state) => { });
                                            modeles.CrashState.findOneAndUpdate({}, { $pull: { players: { User: element.User } } }, {}, (err, state) => { });

                                        });
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