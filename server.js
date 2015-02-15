var express = require('express');
var bodyParser = require('body-parser'); // Для распарсивания POST-запросов
var app = express();
var ioServer = require('http').Server(app);
ioServer.listen(3010);

var io = require('socket.io')(ioServer);
var config = require('./config');
var RoomManager = require('./server/roomManager');
var roomManager = new RoomManager();

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
})); 

app.use('/', express.static(__dirname + '/example'));
// app.use('/game', require('./server/roomManager'));
app.use('/build', express.static(__dirname + '/build'));
app.use('/node_modules', express.static(__dirname + '/node_modules'));


var server = app.listen(config.port || 3009, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Tanks app listening at http://%s:%s', host, port);
});

io.on('connection', function (socket, str) {
    socket.on('enter', function (data) {
        roomManager
            .create(data.roomName)
            .on('frame', function(frame) {
                socket.emit('frame', frame);
            });
    });
});