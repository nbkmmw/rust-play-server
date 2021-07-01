const mongoose = require('mongoose');

const CrashState = mongoose.Schema({
    isRunning: Boolean,
    timeToRun: Number,
    current_coefficient: Number,
    stop_coefficient: Number,
    id: Number,
    runningTime: Number,
    players: [
        {
            User: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
            Amount: Number,
            hasAutoStop: Boolean,
            AutoStop: Number
        }
    ],
    history:
        [
            {
                User: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
                Amount: Number,
                Stop: Number,
                Win: Number,
            }
        ]
});

const User = new mongoose.Schema({
    Username: String,
    Steamid: String,
    Avatar: String,
    Balance: Number
});

const HiloState = new mongoose.Schema({
    timeToNextCard: Number,
    card: {
        _type: String,
        color: String
    },
    players:
        [
            {
                User: {
                    type: mongoose.SchemaTypes.ObjectId,
                    ref: 'User'
                },
                Choose: String,
                Bet: Number
            }
        ],
    history: [{ _type: String, color: String }]
});

const WheelState = new mongoose.Schema({
    timeToStart: Number,
    Items: [{ color: String, coef: Number }],
    choosedItem: { color: String, coef: Number },
    players:
        [
            {
                User: {
                    type: mongoose.SchemaTypes.ObjectId,
                    ref: 'User'
                },
                Choose: String,
                Bet: Number
            }
        ]
});

const Chat = new mongoose.Schema({
    lang: String,
    buffer: [{ Sender: { type: mongoose.SchemaTypes.ObjectId, ref: 'User', Message: String } }]
});

const modeles = {
    User: new mongoose.model("User", User),
    CrashState: new mongoose.model("CrashState", CrashState),
    HiloState: new mongoose.model("HiloState", HiloState),
    WheelState: new mongoose.model("WheelState", WheelState),
    Chat: new mongoose.model("Chat", Chat)
};
exports.modeles = modeles;