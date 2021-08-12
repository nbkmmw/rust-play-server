const mongoose = require('mongoose');


const CrashState = mongoose.Schema({
    isRunning: Boolean,
    timeToRun: Number,
    current_coefficient: Number,
    stop_coefficient: Number,
    id: Number,
    runningTime: Number,
    win_coef: Number,
    players: [
        {
            _id: String,
            User: String,
            Amount: Number,
            hasAutoStop: Boolean,
            AutoStop: Number
        }
    ],
    history:
        [
            {
                User: String,
                Amount: Number,
                Stop: Number,
                Win: Number,
                Username: String,
                Avatar: String
            }
        ]
});

const User = new mongoose.Schema({
    Username: String,
    Steamid: String,
    Avatar: String,
    Balance: Number,
    isAdmin: Boolean,
    gamesPlayed: Number,
    totalWithdraw: Number,
    totalWin: Number,
    totalTopup: Number,
    _id: String,
    isOnline: Boolean,
    timeToOffline: Number,
    items: [
        {
            Name: String,
            Price: Number,
            Img: String,
            Count: Number
        }
    ],
    tradeLink: {
        type: String,
        default: undefined
    }
});

const HiloState = new mongoose.Schema({
    timeToNextCard: Number,
    card: {
        _type: String,
        color: String
    },
    win_coef: Number,
    players:
        [
            {
                _id: String,
                User: String,
                Choose: String,
                Bet: Number,
                Username: String,
                Avatar: String
            }
        ],
    history: [{ _type: String, color: String }],
    players_history: [{
        User: String,
        Choose: String,
        Bet: Number,
        Win: Number,
        Username: String,
        Avatar: String
    }],
    hi_coef: Number,
    lo_coef: Number
});

const WheelState = new mongoose.Schema({
    timeToStart: Number,
    Items: [
        { type: Number }
    ],
    choosedItem: 0,
    win_coef: Number,
    players:
        [
            {
                _id: String,
                User: String,
                Choose: String,
                Bet: Number,
                Avatar: String,
                Username: String
            }
        ],
    Hash: String,
    Id: Number
});

const JackpotState = new mongoose.Schema({
    isRunning: Boolean,
    runningTime: Number,
    isWaiting: Boolean,
    timeToStart: Number,
    bank: {
        totalPrice: Number,
        totalCount: Number,
        items: [{
            Price: Number,
            Name: String,
            Img: String,
            Count: Number
        }]
    },
    players: [{
        _id: String,
        User: String,
        Bet: {
            Count: Number,
            Price: Number,
            Items: [
                {
                    Price: Number,
                    Name: String,
                    Img: String,
                    Count: Number
                }
            ]
        },
        Chance: Number,
        Username: String,
        Avatar: String
    }],
    winner:
    {
        _id: String,
        User: String,
        Bet: {
            Count: Number,
            Price: Number,
            Items: [
                {
                    Price: Number,
                    Name: String,
                    Img: String,
                    Count: Number
                }
            ]
        },
        Chance: Number,
        Username: String,
        Avatar: String
    },
    id: Number,
    lastGame: {
        players: [{
            _id: String,
            User: String,
            Bet: {
                Count: Number,
                Price: Number,
                Items: [
                    {
                        Price: Number,
                        Name: String,
                        Img: String
                    }
                ]
            },
            Chance: Number,
            Username: String,
            Avatar: String
        }],
        id: Number,

    }
})

const CoinflipState = new mongoose.Schema({
    rooms: [
        {
            id: Number,
            firstPlayer: {
                _id: String,
                User: String,
                Bet: {
                    Count: Number,
                    Price: Number,
                    Items: [
                        {
                            Price: Number,
                            Name: String,
                            Img: String
                        }
                    ]
                },
                Username: String,
                Avatar: String
            },
            secondPlayer: {
                _id: String,
                User: String,
                Bet: {
                    Count: Number,
                    Price: Number,
                    Items: [
                        {
                            Price: Number,
                            Name: String,
                            Img: String
                        }
                    ]
                },
                Username: String,
                Avatar: String
            },
            bank: {
                totalPrice: Number,
                totalCount: Number,
                items: [{
                    Price: Number,
                    Name: String,
                    Img: String,
                    Count: Number
                }]
            },
            winner: {
                type: String,
                ref: 'User'
            },
            timeToRun: Number,
            timeToClose: Number,
            isEnded: Boolean,
            isWaiting: Boolean
        }
    ],
    lastid: Number
})
const Chat = new mongoose.Schema({
    lang: String,
    buffer: [{ username: String, message: String, avatar: String, time: String }]
});

const TraderBot = new mongoose.Schema({
    _id: String,
    Username: String,
    Password: String,
    Iventory: [
        {
            Name: String,
            Count: Number,
            Price: Number,
            Img: String
        }
    ]
})

const TradeInfo = new mongoose.Schema({
    Tasks: [
        {
            _type: String,
            options: Object
        }
    ]
}, { strict: false })
const modeles = {
    User: new mongoose.model("User", User),
    CrashState: new mongoose.model("CrashState", CrashState),
    HiloState: new mongoose.model("HiloState", HiloState),
    WheelState: new mongoose.model("WheelState", WheelState),
    JackpotState: new mongoose.model("JackpotState", JackpotState),
    CoinflipState: new mongoose.model("CoinflipState", CoinflipState),
    Chat: new mongoose.model("Chat", Chat),
    TraderBot: new mongoose.model("TraderBot", TraderBot),
    TradeInfo: new mongoose.model("TraderInfo", TradeInfo)
};
exports.modeles = modeles;