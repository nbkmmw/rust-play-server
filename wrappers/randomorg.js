const fetch = require('node-fetch');
const apikey = "a9bec6be-5741-407a-be4f-06bbc7e31990";
/**
 * 
 * @param {Number} min 
 * @param {Number} max 
 */
async function getRandomFloat(min, max) {

    let integer = Number(await getRandomInteger(min.toFixed(0), max.toFixed(0)));
    let float = Number(await getRandomInteger(
        ((min % 1) * 100).toFixed(0),
        ((max % 1) * 100).toFixed(0) != 0 ? ((max % 1) * 100).toFixed(0) : 99
    )) / 100;
    let result = integer + float;
    return result;

    //return (Math.random() * (max - min) + min);
}
async function getRandomInteger(min, max) {

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

    await fetch("https://api.random.org/json-rpc/1/invoke", options)
        .then(res => res.json())
        .then(json => { return json['result']['random']['data'][0] });

    //return Number(Math.random() * (max - min) + min).toFixed(0);
}

async function getRandomItem(...items) {
    return items[Math.floor(Math.random() * items.length)];
}
exports.getRandomInteger = getRandomInteger;
exports.getRandomFloat = getRandomFloat;
exports.getRandomItem = getRandomItem;