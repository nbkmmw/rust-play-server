const modeles = require('../modeles').modeles;
const SteamAuth = require("node-steam-openid");

const steam = new SteamAuth({
    realm: "http://localhost:3000", // Site name displayed to users on logon
    returnUrl: "http://localhost:3000/auth/steam/authenticate", // Your return route
    apiKey: "F7EB8B5146C0C2B2A62B1B03EDDC8120" // Steam API key
});

async function steamAuthenticate(req, res) {
    try {
        const user = await steam.authenticate(req);

        modeles.User.findOne({ Steamid: user._json.steamid }, function (err, u) {
            if (u) {
                return res.send(u);
            }
            else {
                u = new modeles.User({
                    Username: user.username,
                    Steamid: user._json.steamid,
                    Avatar: user._json.avatar,
                    Balance: 0,

                });
                u.save();
                return res.send(u)
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

const auth = {
    steam: {
        auth: steamAuth,
        authenticate: steamAuthenticate
    }
};

exports.module = auth;