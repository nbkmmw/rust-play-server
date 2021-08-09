const modeles = require('../modeles').modeles;
const SteamAuth = require("node-steam-openid");
const utils = require('../utils')
const steam = new SteamAuth({
    realm: utils.self_url, // Site name displayed to users on logon
    returnUrl: `${utils.self_url}/auth/steam/authenticate`, // Your return route
    apiKey: utils.steam_api_key // Steam API key
});

async function steamAuthenticate(req, res) {
    try {
        const user = await steam.authenticate(req);

        modeles.User.findOne({ _id: user._json.steamid }, function (err, u) {
            if (u) {
                req.session.user = u;
                res.cookie("user", JSON.stringify(u), { maxAge: 900000 * 900000 })
                res.redirect(utils.front_url)
            }
            else {
                u = new modeles.User({
                    Username: user.username,
                    Steamid: user._json.steamid,
                    Avatar: user._json.avatar,
                    Balance: 0,
                    isAdmin: false,
                    _id: user._json.steamid,
                    gamesPlayed: 0,
                    totalWin: 0,
                    totalTopup: 0,
                    totalWithdraw: 0,
                    isOnline: true,
                    timeToOffline: 60 * 10
                });
                u.save();
                req.session.user = u;
                res.cookie("user", JSON.stringify(u), { maxAge: 900000 * 900000 })
                res.redirect(utils.front_url)
            }
        });
        //...do something with the data
    } catch (error) {
        console.error(error);
    }
}

async function steamAuth(req, res) {
    const redirectUrl = await steam.getRedirectUrl();
    return res.redirect(redirectUrl);
}

async function login(req, res) {
    modeles.User.findOneAndUpdate({ _id: req.query.id }, { timeToOffline: 60 * 10 }, {}, (err, user) => {
        req.session.user = user
        res.cookie("user", JSON.stringify(user), { maxAge: 900000 * 900000 })
        res.send(user)
    })
}
async function getMe(req, res) {
    modeles.User.findOne({ _id: req.session.user._id }, (err, user) => {
        req.session.user = user
        res.cookie("user", JSON.stringify(user), { maxAge: 900000 * 900000 })
        res.send(user)
    })
}

async function getUserInfo(req, res) {
    modeles.User.findOne({ _id: req.query.id }, (err, user) => {
        return res.send(user)
    })
}
async function logout(req, res) {
    req.session.user = []
    res.clearCookie("user");
    res.redirect("http://localhost:3000/")
}

async function setTradeLink(req, res) {
    if (req.session.user) return res.send({ error: true, message: 'no authorized user' })
    modeles.User.findOneAndUpdate({ _id: req.session.user._id }, { tradeLink: req.query.new_link }, { err }, () => {
        if (!err)
            return res.send({ error: false, message: 'succesful' })
        else
            return res.send({ error: true, message: err })
    })
}
const auth = {
    steam: {
        auth: steamAuth,
        authenticate: steamAuthenticate,
        logout: logout
    },
    utils:
    {
        getMe: getMe,
        getUserInfo: getUserInfo,
        login: login,
        setTradeLink: setTradeLink
    }
};

exports.module = auth;