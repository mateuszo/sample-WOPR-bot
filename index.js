var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var secret = require('./secret.js');

var app = express();
app.use(bodyParser.json());

app.set('port', (process.env.PORT || 3000));

//This logs the requests, so you can see what messages you receive
app.use(function(req, res, next) {
    console.log('received :' + req.method + ' request: ');
    console.log('request body', JSON.stringify(req.body));
    next();
});

//Application verification
app.get('/webhook', function(req, res) {
    if (req.query['hub.verify_token'] === secret.verify_token) {
        res.send(req.query['hub.challenge']);
        console.log('Valid token');
    } else {
        res.send('Error, wrong validation token');
        console.error('Wrong validation token');
    }
});

//This one handles message reception
app.post('/webhook', function(req, res) {
    var messaging = req.body.entry[0].messaging;
    for (var i = 0; i < messaging.length; i++) {
        var event = messaging[i];
        var senderId = event.sender.id;
        //if the message is not empty
        if (event.message && event.message.text) {
            var text = event.message.text;
            console.log('Received: ' + text + ' from: ' + senderId);
            echo(senderId, text);
        }
    }
    res.sendStatus(200);
});


app.listen(app.get('port'), function() {
    console.log('Magic starts on port', app.get('port'));
});


function echo(sender, text) {
    var messageData = {
        text: '[echo] ' + text
    };
    request({
        method: 'POST',
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
            access_token: secret.token
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
