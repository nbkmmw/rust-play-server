const modeles = require('../modeles').modeles
var Winston = require('winston'); // For logging
var SteamUser = require('steam-user'); // The heart of the bot.  We'll write the soul ourselves.
var TradeOfferManager = require('steam-tradeoffer-manager'); // Only required if you're using trade offers
var config = require('./config.js');
var fs = require('fs'); // For writing a dope-ass file for TradeOfferManager

let bots = []
// We have to use application IDs in our requests--this is just a helper

var appid = {
    TF2: 440,
    DOTA2: 570,
    CSGO: 730,
    Steam: 753
};
// We also have to know context IDs which are a bit tricker since they're undocumented.
// For Steam, ID 1 is gifts and 6 is trading cards/emoticons/backgrounds
// For all current Valve games the context ID is 2.
var contextid = {
    TF2: 2,
    DOTA2: 2,
    CSGO: 2,
    Steam: 6
}

// Setup logging to file and console
var logger = new (Winston.createLogger)({
    transports: [
        new (Winston.transports.Console)({
            colorize: true,
            level: 'debug'
        }),
        new (Winston.transports.File)({
            level: 'info',
            timestamp: true,
            filename: 'cratedump.log',
            json: false
        })
    ]
});

class Bot {
    #client
    #offers
    #tasks = []
    constructor(username, password) {
        this.#client = new SteamUser();
        this.#offers = new TradeOfferManager({
            steam: this.#client,
            domain: config.domain,
            language: "en", // English item descriptions
            pollInterval: 10000, // (Poll every 10 seconds (10,000 ms)
            cancelTime: 300000 // Expire any outgoing trade offers that have been up for 5+ minutes (300,000 ms)
        });

        // If we've run this before, we should have a saved copy of our poll data.
        // We can load this up to gracefully resume polling as if we never crashed/quit
        fs.readFile('polldata.json', function (err, data) {
            if (err) {
                logger.warn('Error reading polldata.json. If this is the first run, this is expected behavior: ' + err);
            } else {
                logger.debug("Found previous trade offer poll data.  Importing it to keep things running smoothly.");
                this.#offers.pollData = JSON.parse(data);
            }
        });

        // Sign into Steam
        this.#client.logOn({
            accountName: username,
            password: password
        });

        this.#client.on('loggedOn', function (details) {
            logger.info("Logged into Steam as " + this.#client.steamID.getSteam3RenderedID());
            // If you wanted to go in-game after logging in (for crafting or whatever), you can do the following
            // client.gamesPlayed(appid.TF2);
        });

        this.#client.on('error', e => {
            // Some error occurred during logon.  ENums found here: 
            // https://github.com/SteamRE/SteamKit/blob/SteamKit_1.6.3/Resources/SteamLanguage/eresult.steamd
            logger.error(e);
            this.logout()
        });

        this.#client.on('webSession', (sessionID, cookies) => {
            logger.debug("Got web session");
            // Set our status to "Online" (otherwise we always appear offline)
            this.#client.friends.setPersonaState(SteamUser.Steam.EPersonaState.Online);
            this.#offers.setCookies(cookies, err => {
                if (err) {
                    logger.error('Unable to set trade offer cookies: ' + err);
                    this.logout()
                }
                logger.debug("Trade offer cookies set.  Got API Key: " + this.#offers.apiKey);
            });
        });

        // Emitted when Steam sends a notification of new items.
        // Not important in our case, but kind of neat.
        this.#client.on('newItems', (count) => {
            logger.info(count + " new items in our inventory");
        });

        // Emitted on login and when email info changes
        // Not important in our case, but kind of neat.
        this.#client.on('emailInfo', (address, validated) => {
            logger.info("Our email address is " + address + " and it's " + (validated ? "validated" : "not validated"));
        });

        // Emitted on login and when wallet balance changes
        // Not important in our case, but kind of neat.
        this.#client.on('wallet', (hasWallet, currency, balance) => {
            if (hasWallet) {
                logger.info("We have " + SteamUser.formatCurrency(balance, currency) + " Steam wallet credit remaining");
            } else {
                logger.info("We do not have a Steam wallet.");
            }
        });

        // Looking at your account limitations can be very useful depending on what you're doing
        this.#client.on('accountLimitations', (limited, communityBanned, locked, canInviteFriends) => {
            if (limited) {
                // More info: https://support.steampowered.com/kb_article.php?ref=3330-IAGK-7663
                logger.warn("Our account is limited. We cannot send friend invites, use the market, open group chat, or access the web API.");
            }
            if (communityBanned) {
                // More info: https://support.steampowered.com/kb_article.php?ref=4312-UOJL-0835
                // http://forums.steampowered.com/forums/showpost.php?p=17054612&postcount=3
                logger.warn("Our account is banned from Steam Community");
                // I don't know if this alone means you can't trade or not.
            }
            if (locked) {
                // Either self-locked or locked by a Valve employee: http://forums.steampowered.com/forums/showpost.php?p=17054612&postcount=3
                logger.error("Our account is locked. We cannot trade/gift/purchase items, play on VAC servers, or access Steam Community.  Shutting down.");
                this.logout()
            }
            if (!canInviteFriends) {
                // This could be important if you need to add users.  In our case, they add us or just use a direct tradeoffer link.
                logger.warn("Our account is unable to send friend requests.");
            }
        });

        // When we get a new offer...
        this.#offers.on('newOffer', offer => {
            logger.info("New offer #" + offer.id + " from " + offer.partner.getSteam3RenderedID());
            logger.info(offer)
            // Accept any trade offer from the bot administrator, or where we're getting free stuff.
            if (offer.partner.getSteamID64() === config.admin || offer.itemsToGive.length === 0) {
                logger.info("User " + offer.partner.getSteam3RenderedID() + " offered a valid trade.  Trying to accept offer.");
                offer.accept(err => {
                    if (err) {
                        logger.error("Unable to accept offer " + offer.id + ": " + err.message);
                    } else {
                        logger.info("Offer accepted");
                    }
                });
            } else { // Otherwise deny it and message the user
                logger.info("User " + offer.partner.getSteam3RenderedID() + " offered an invalid trade.  Declining offer.");
                offer.decline(function (err) {
                    if (err) {
                        logger.error("Unable to decline offer " + offer.id + ": " + err.message);
                    } else {
                        logger.debug("Offer declined");
                        // Message the user
                        this.#client.friends.sendMessage(offer.partner.getSteamID64(), "Invalid offer.  Please use the chat interface to request items.  Trade offers sent to me must only include items you're giving to me.");
                    }
                });
            }
        });

        // When an offer sent by someone else changes states
        this.#offers.on('receivedOfferChanged', (offer, oldState) => {
            logger.info(offer.partner.getSteam3RenderedID() + " Offer #" + offer.id + " changed: " + TradeOfferManager.getStateName(oldState) + " -> " + TradeOfferManager.getStateName(offer.state));

            // Alert us when we accept an offer
            if (offer.state == TradeOfferManager.ETradeOfferState.Accepted) {
                offer.getReceivedItems(function (err, items) {
                    if (err) {
                        logger.error("Couldn't get received items: " + err);
                    } else {
                        let names = items.map(function (item) {
                            return item.name;
                        });
                        // Log a comma-separated list of items received
                        logger.info("Received: " + names.join(', '));
                    }
                });
            }
        });

        // When one of our offers changes states
        this.#offers.on('sentOfferChanged', (offer, oldState) => {
            // Alert us when one of our offers is accepted
            if (offer.state == TradeOfferManager.ETradeOfferState.Accepted) {
                logger.info("Our sent offer #" + offer.id + " has been accepted.");
            }
        });

        // Steam is down or the API is having issues
        this.#offers.on('pollFailure', (err) => {
            logger.error("Error polling for trade offers: " + err);
        });

        // When we receive new trade offer data, save it so we can use it after a crash/quit
        this.#offers.on('pollData', (pollData) => {
            fs.writeFile('polldata.json', JSON.stringify(pollData));
        });

        function sendCrates(steamID, series, amount) {/*
            // If no series requested, give up.
            if (!series) {
                return true;
            }
            // If not amount requested, assume 1.
            if (!amount) {
                let amount = 1;
            }

            offers.loadInventory(appid.CSGO, contextid.CSGO, true, function (err, inventory) {
                if (err) {
                    logger.error(err);
                } else {
                    // Filter out all the crates
                    let pool = inventory.filter(function (item) {
                        return item.tags.some(function (element, index, array) {
                            return element.internal_name == 'Supply Crate';
                        });
                    });
                    // Filter out the series
                    let re = new RegExp('#' + series, 'i'); // ex: #82
                    pool = pool.filter(function (item) {
                        return item.name.match(re);
                    });

                    // Let the user know we don't have any
                    if (pool.length === 0) {
                        client.friends.sendMessage(steamID, 'I don\'t have any crates of series ' + series + ' available.  Sorry!');
                        return true; // Give up
                    } // Let the user know we don't have enough
                    else if (amount > pool.length) {
                        logger.debug('User requested ' + amount + ' of series ' + series + '.  I only have ' + pool.length + ' available.');
                        client.friends.sendMessage(steamID, 'I only have ' + pool.length + ' crates of series ' + series + ' available.  Sending a trade offer with all crates of this series.');
                    }

                    // Start a new trade offer
                    let trade = offers.createOffer(steamID);

                    // Add what we should to the current trade
                    logger.debug('Adding ' + pool.length + ' crates of series ' + series);
                    trade.addMyItems(pool);

                    // Send the offer off to Steam with a cute message
                    trade.send('Here are the free crates you requested!  <3', function (err, status) {
                        if (err) {
                            logger.error(err);
                            client.friends.sendMessage(steamID, 'Something went wrong when trying to send the trade offer. Steam message: ' + err);
                        } else if (status == 'pending') {
                            logger.warn('Trade offer sent but awaiting email confirmation. You should probably turn off email confirmation here: http://steamcommunity.com/my/edit/settings/');
                            client.friends.sendMessage(steamID, 'Awaiting email confirmation');
                        } else {
                            logger.info('Trade offer sent successfully');
                            client.friends.sendMessage(steamID, 'Trade offer sent successfully.  You can find the offer here: http://steamcommunity.com/tradeoffer/' + trade.id);
                        }
                    });
                }
            });*/
        }
    }
    /**
     * 
     * if error returns 1, else succesfull return 0
     * 
     */
    logout() {
        return 0 // succesfull
    }

    /**
     * return an inventory
     * if error returns 1
     */
    getInventory() {
        let inven
        this.#offers.loadInventory(appid.CSGO, contextid.CSGO, true, (err, inventory) => {
            if (err) logger.error(err)
            else {
                logger.info(inventory)
                inven = inventory
            }
        })
        return inven
    }
    /**
     * 
     * @param {String} type type of task
     * @param {Object} options options for task
     * 
     * if task not seted returns 1
     * if task set succesfull returns 0
     */
    setTask(type, options) {
        if (task === "withdraw") {
            logger.error("withdraw not implemented")
            return 1
        }
        else if (task === "topup") {

        }
        return 0 // succesfull
    }
    haveItems(items) {
        return true
    }
}


// Initialize the Steam client and our trading library

return
function init() {
    modeles.TraderBot.find({}, (err, bots) => {
        for (let i = 0; i < bots.length; i++) {
            let bot = bots[i]


        }
    })
}

function newTask(type, options) {

}
function getInfo(id) {

}

async function update() {

}
const bot = {
    init: init,
    newTask: newTask,
    getInfo: getInfo,
    update: update
}
exports.module = bot

console.log(require)