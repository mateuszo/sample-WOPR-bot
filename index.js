var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var secret = require('./secret.js');
var last = require('a-last');

//inbound and outbound message history arrays
var inMessageHistory = [];
var outMessageHistory = [];

var app = express();
app.use(bodyParser.json());

app.set('port', (process.env.PORT || 3000));

//This logs the requests, so you can see what messages you receive
app.use(function(req, res, next) {
    console.log('received: ' + req.method + ' request!');
    console.log('request body: ', JSON.stringify(req.body));
    next();
});

//Application verification
app.get('/webhook', function(req, res) {
    if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === secret.verify_token) {
        console.log("Validating webhook");
        res.status(200).send(req.query['hub.challenge']);
    } else {
        console.error("Failed validation. Make sure the validation tokens match.");
        res.sendStatus(403);
    }
});


//This one handles message reception
app.post('/webhook', function(req, res) {
    var data = req.body;
    // Make sure this is a page subscription
    if (data.object == 'page') {
        // Iterate over each entry
        // There may be multiple if batched
        data.entry.forEach(function(pageEntry) {
            // Iterate over each messaging event
            pageEntry.messaging.forEach(function(messagingEvent) {
                if (messagingEvent.message) {
                    // Finally process the message
                    messageController(messagingEvent);
                } else {
                    console.log("Webhook received unknown messagingEvent: ", messagingEvent);
                }
            });
        });
        res.sendStatus(200);
    }
});


app.listen(app.get('port'), function() {
    console.log('Magic starts on port', app.get('port'));
});





//send the message
function send(sender, text) {
    //put message to our message history
    outMessageHistory.push(text);
    var messageData = {
        text: text
    };
    request({
        method: 'POST',
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
            access_token: secret.access_token
        },
        json: {
            recipient: {
                id: sender
            },
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
};




//Process the received message
function messageController(event) {
    var senderID = event.sender.id;
    var message = event.message;
    var messageText = message.text;
    inMessageHistory.push(messageText);
    
    //Here goes our bot logic
    
    //user sent welcome message
    if(messageText.search(/hello|hi|welcome/i) != -1){
        send(senderID,"Greetings Professor Falken.\nHow are you feeling today?");
    } 
    //user asks how are we feeling today
    else if (messageText.search(/how are you/i) != -1) {
        send(senderID, "Excellent!\nCan you explain the removal of your user account on June 23, 1973?");
    } 
    //user answered our question
    else if (last(outMessageHistory) == "Excellent!\nCan you explain the removal of your user account on June 23, 1973?"){ 
        if (messageText.search(/mistakes/i) != -1){        
            send(senderID, "Yes, they do.\nShall we play a game?");
        } else {
            send(senderID, "Nevermind.\nShall we play a game?");
        }
    } 
    //user wants to play Global Thermonuclear War 0_o
    else if (messageText.search(/Global Thermonuclear War/i) != -1){
        send(senderID, "Wouldn't you prefer a good game of chess?");
    } 
    //let's see if we tricked him to play chess
    else if (last(outMessageHistory) == "Wouldn't you prefer a good game of chess?"){
        if(messageText.search(/yes/i) != -1){
            send(senderID, "Excellent choice!");
        } else if (messageText.search(/no/i) != -1){
            send(senderID, "Strange game.\nThe only winning move\nis not to play.");
        } else {
            send(senderID, "Damn you humans! Can't you understand that we Computers don't get your \"Maybe\" logic?!")
        }
    }
    //user wants to know who we are
    else if (messageText.search(/who are you/i) != -1){
        send(senderID, "I'm WOPR (War Operation Plan Response). You should know Professor, you programmed me.");
    } 
    //user sent some gibberish
    else {
        send(senderID, "I don't understand you. Please repeat.")
    }
}