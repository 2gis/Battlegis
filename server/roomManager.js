var Room = require('./room');
var config = require('../config');
var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;

inherits(RoomManager, EventEmitter);

function RoomManager() {
    this.rooms = [];
}

RoomManager.prototype.create = function(roomName) {
    roomName = roomName || Math.random() * Math.MAX_SAFE_INTEGER;

    var room = new Room();

    return this.rooms[roomName] = room;
};

RoomManager.prototype.dispose = function(roomName) {
    this.rooms[roomName] && this.rooms[roomName].dispose();
};

module.exports = RoomManager;