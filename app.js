const express = require('express');
const bodyParser = require('body-parser');
const modeles = require('./modeles').modeles;
const mongoose = require('mongoose');

const app = express();
const port = 3000;
const games = {
  Crash: require('./games/crash').game,
  Hilo: require('./games/hilo').game,
  Wheel: require('./games/wheel').game
};
const modules = {
  Auth: require('./modules/auth').module,
  Chat: require('./modules/chat').module
}

mongoose.Promise = global.Promise;

mongoose.connect(`mongodb://localhost/3453hrarje2dhbhsre43`, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB has started'))
  .catch(e => console.log(e));

Object.keys(games).map(function (key, index) {
  let game = games[key];
  game.update();
});

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.header({ "Access-Control-Allow-Origin": "*" });
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/games/crash/getState', games.Crash.getState);

app.get('/games/crash/makeBet', games.Crash.addPlayer);

app.get('/games/hilo/getState', games.Hilo.getState);

app.get('/games/hilo/makeBet', games.Hilo.makeBet);

app.get('/games/wheel/getState', games.Wheel.getState);

app.get('/games/wheel/makeBet', games.Wheel.makeBet);

app.get("/auth/steam", modules.Auth.steam.auth);

app.get("/auth/steam/authenticate", modules.Auth.steam.authenticate);

app.get("/chat/getMessages", modules.Chat.getMessages);

app.post("/chat/sendMessage", modules.Chat.sendMessage);


app.listen(port, () => {
  console.log(`server listening at http://localhost:${port}`);
});
