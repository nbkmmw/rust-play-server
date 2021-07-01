const modeles = require('../modeles').modeles;
const random = require('../wrappers/randomorg');

async function update() {

    setTimeout(update, 10);
}

const wheel = {
    getState: getState,
    makeBet: makeBet,
    update: update
};



exports.game = wheel;