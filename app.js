const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session')
const modeles = require('./modeles').modeles;
const mongoose = require('mongoose');

const ses = {
  secret: "3ewwt2tef",
  cookie: {
    httpOnly: false
  }
}
const app = express();
const port = 3001;
console.time('log')
const games = {
  Crash: require('./games/crash').game,
  Hilo: require('./games/hilo').game,
  Wheel: require('./games/wheel').game,
  Jackpot: require('./games/jackpot').game,
  Coinflip: require('./games/coinflip').game
};
const modules = {
  Auth: require('./modules/auth').module,
  Chat: require('./modules/chat').module,
  AdminPanel: require('./modules/admin_panel').module,
  User: require('./modules/user').module
}

modules.User.update()
mongoose.Promise = global.Promise;

mongoose.connect(`mongodb://localhost/rust-play`, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB has started')
    Object.keys(games).map(function (key, index) {
      let game = games[key];
      game.update();
    });
  })
  .catch(e => console.log(e));



app.use(bodyParser.json());
app.use(session(ses))
app.use(cookieParser())

app.use((req, res, next) => {
  res.header({ "Access-Control-Allow-Origin": "http://localhost:3000" });
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header({ "Access-Control-Allow-Credentials": "true" });
  next();
});

app.get('/games/crash/getState', games.Crash.getState);

app.get('/games/crash/makeBet', games.Crash.addPlayer);

app.get('/games/hilo/getState', games.Hilo.getState);

app.get('/games/hilo/makeBet', games.Hilo.makeBet);

app.get('/games/wheel/getState', games.Wheel.getState);

app.get('/games/wheel/makeBet', games.Wheel.makeBet);

app.get('/games/jackpot/getState', games.Jackpot.getState);

app.post('/games/jackpot/makeBet', games.Jackpot.makeBet)

app.get("/games/coinflip/getRoom", games.Coinflip.getRoom)

app.get("/games/coinflip/getState", games.Coinflip.getState)

app.get("/games/coinflip/createRoom", games.Coinflip.createRoom)

app.get("/games/coinflip/enterRoom", games.Coinflip.enterRoom)

app.get("/auth/steam", modules.Auth.steam.auth);

app.get("/auth/steam/authenticate", modules.Auth.steam.authenticate);

app.get("/logout", modules.Auth.steam.logout);

app.get("/chat/getMessages", modules.Chat.getMessages);

app.post("/chat/sendMessage", modules.Chat.sendMessage);

app.post("/admin/panel/modifyUser", modules.AdminPanel.ModifyUser)

app.post("/admin/panel/modifyGame", modules.AdminPanel.ModifyGame)

app.get("/admin/panel/getUsers")

app.get("/user/getMe", modules.Auth.utils.getMe)

app.get("/user/getUserInfo", modules.Auth.utils.getUserInfo)

app.get("/user/getOnline", modules.User.getOnlineCount)

app.get("/login", modules.Auth.utils.login)

app.get("/user/setTradeLink", modules.Auth.utils.setTradeLink)

app.get("/user/setUsername", modules.User.setUsername)

app.listen(port, () => {
  console.log(`server listening at http://localhost:${port}`);
});
