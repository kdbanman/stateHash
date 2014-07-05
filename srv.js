var express = require('express');
var http = require('http');
var path = require('path');
var logger = require('morgan');
var io = require('socket.io');
var _ = require('underscore');

var genCommand = require('./lib/generate.js');
var validateCommand = require('./lib/validate.js');
var storage = require('./lib/storage.js');

var app = express();
var server = http.Server(app)
var ioSrv = io(server)

// log request/response activity in dev mode
app.use(logger('dev'));

// handle root results request
app.get('/results', function (req, res) {
    // get discrepancy counts of all 4 algorithms
    var djb2 = sdbm = javaHashCode = crc_32 = -1;
    storage.discrepancyCountTotals(function (err, totals) {
        if (err) {
            res.send(JSON.stringify(err));
            console.error(err);
        } else {
            res.send(JSON.stringify(totals));
        }
    });
});

// handle hash results request
app.get('/results/:hash', function (req, res) {

});

// handle hash and seed results request
app.get('/results/:hash/:seed', function (req, res) {

});

// try to serve requests as static file requests from the public/ directory
app.use(express.static(path.join(__dirname, 'public')));

// receive client socket connections
ioSrv.on('connection', function (socket) {
    
    // get identification info from socket request
    var userAgent = socket.request.headers['user-agent'];
    userAgent = typeof userAgent === 'string' ? userAgent : "AGENT UNSPECIFIED";
    console.log('Connection from %s', userAgent);
    
    // initialize seed counter
    var currSeed = 1;

    // count write errors caused by this client
    var errors = 0;

    // emit initial generate command, appendng current time in millis
    socket.emit('generate', _.extend(genCommand(currSeed), {sent: Date.now()}));

    // receive client result events
    socket.on('result', function (data, fn) {

        // append round trip millis
        if (typeof data.sent === 'number') data.rtt = Date.now() - data.sent;

        // append the user agent
        data.user_agent = userAgent;

        //get number of connected clients
        data.connected_clients = ioSrv.sockets.sockets.length;
        
        // call client callback to notify receipt
        if (typeof fn === 'function') fn();

        // verify client data
        validateCommand(data, currSeed, function(err) {
            if (err) {
                // data was not valid.  notify client and disconnect
                console.error("ERROR: bad data received from %s", userAgent);
                console.error("       " + JSON.stringify(data));
                console.error("       " + err);

                // do not talk to client if it generates > 5 errors
                errors++;
                if (errors > 5) {
                    socket.emit("server error", {ERROR: "invalid data sent to server"});
                    socket.disconnect();
                }
            } else {

                // data was valid, store it using an error callback
                storage.store(data, function(err) {
                    if (err) {
                        console.error("ERROR: could not store data from %s", userAgent);
                        console.error("       " + JSON.stringify(data));
                        console.error("       " + err);
               
                        // do not talk to client if it generates > 5 errors
                        errors++;
                        if (errors > 5) {
                            socket.emit("server error", {ERROR: "too many server write errors generated"});
                            socket.disconnect();
                        }
                    }
                });
            }
        });
       
        // increment seed counter and emit subsequent generate command
        // append current time in millis
        if (typeof data.seed === "number") currSeed = data.seed + 1;
        else currSeed = currSeed + 1;
        socket.emit('generate', _.extend(genCommand(currSeed), {sent: Date.now()}));
    });

    // report disconnections
    socket.on('disconnect', function() {
        console.log('Disconnection from %s', userAgent);
    });

    // report errors (socket.io error event and my own)
    socket.on('error', function(err) {
        console.error('ERROR from %s:', userAgent);
        console.error('    ' + JSON.stringify(err));
    });
    // change to client error here and in public/comms.js
    socket.on('stateHash error', function(err) {
        console.error('ERROR from %s:', userAgent);
        console.error('    ' + JSON.stringify(err));
    });
});

// start the app server on port 8080
server.listen(8080);
console.log('App listening on port 8080');
