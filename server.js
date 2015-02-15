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

io.on('connection', function (socket) {
    function joinRoom(params) {
        params = params || {};
        var room = roomManager.getRoom(params.id);

        if (!room) throw new Error('room with id ' + params.id + 'not found');

        room.join(params.name, params.sessionId);

        socket.emit('roomJoined', {
            id: room.id,
            map: room.map
        });

        room.on('frame', function(frame) {
            socket.emit('frame', frame);
        });
    };

    // Создать комнату
    socket.on('create', function (data) {
        data = data || {};
        var room = roomManager.create();

        if (room) {
            socket.emit('roomCreated', {
                id: room.id
            });

            data.id = room.id;

            joinRoom(data);
        }
    });

    // Зайти в комнату спектатором
    socket.on('join', joinRoom);

    // Попробовать запустить бота на карту (если есть слоты)
    socket.on('fight', function (params) {
        var room = roomManager.getRoom(params.id);

        var position = room.fight(params.name, params.sessionId, params.ai);
        console.log('params', params);

        if (position) {
            socket.emit('queue', {
                position: position
            });
        } else {
            socket.emit('arenaJoined');
        }
    });
});