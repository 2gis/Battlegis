var _ = require('lodash');
var Room = require('./room');
var config = require('../config');
var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;

inherits(RoomManager, EventEmitter);

function RoomManager() {
    this.rooms = [];
    this.roomsNumber = 0;
}

RoomManager.prototype.create = function() {
    var id = this.roomsNumber++;
    console.log('id', id);

    if (this.rooms[id]) return;

    this.rooms[id] = new Room({
        id: id
    });

    return this.rooms[id];
};

RoomManager.prototype.dispose = function(id) {
    this.rooms[id] && this.rooms[id].dispose();
    this.roomsNumber--;
};

RoomManager.prototype.getRoom = function(id) {
    return this.rooms[id];
};

module.exports = RoomManager;