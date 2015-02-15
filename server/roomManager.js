var Room = require('../room');
var config = require('../config');

module.exports = function(req, res) {
    var room = new Room(config);

    room.on('frame', function(frame) {
        console.log('frame', frame.players[1].x, frame.players[1].y);
    });

    res.json({
        status: 'ok'
    });
};