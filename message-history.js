var last = require('a-last');

/**
 * Stores messaging history.
 * 
 * It's only a simple array of arrays.
 */
function MessageHistory () {
    this.messages = new Array();
}
 
/**
 * Adds message to a history for a given user.
 * 
 * If it's first message for a given user it initializes an array.
 */
MessageHistory.prototype.push = function(user, message) {
    if(!Array.isArray(this.messages[user])){        
        this.messages[user] = new Array();
    }             
    this.messages[user].push(message);
};

/**
 * Returns last message for a given user.
 */
MessageHistory.prototype.last = function (user) {
    return last(this.messages[user]);
};


module.exports = MessageHistory;