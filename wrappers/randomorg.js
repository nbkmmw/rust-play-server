const fetch = require('node-fetch');
const utils = require('../utils')
const apikey = utils.randomorg_api_key;
/**
 * 
 * @param {Number} min 
 * @param {Number} max 
 */
function randomFloat(min, max) {
    let integer = randomInteger(min, max)
    let float = randomInteger(
        0,
        (max % 1).toFixed(2) * 100 ? (max % 1).toFixed(2) * 100 : 99
    ) / 100
    let result = integer + float
    result > max ? result -= 1 : result
    return result
}

function randomInteger(min, max) {

    let options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({
            jsonrpc: "2.0",
            method: "generateIntegers",
            params: {
                apiKey: apikey,
                n: 1,
                min: min,
                max: max,
                replacement: true
            },
            id: "425"
        })
    };

    //await fetch("https://api.random.org/json-rpc/1/invoke", options)
    //    .then(res => res.json())
    //    .then(json => { return json['result']['random']['data'][0] });

    let rand = min + Math.random() * (max + 1 - min);
    return Math.floor(rand);
}

async function getRandomItem(...items) {
    return items[Math.floor(Math.random() * items.length)];
}
exports.getRandomInteger = randomInteger;
exports.getRandomFloat = randomFloat;
exports.getRandomItem = getRandomItem;