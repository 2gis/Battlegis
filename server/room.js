var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;

var Battlegis = require('../engine');
var config = require('../config');

function Room(params) {
    params = params || {};

    this.config = params.config || config;
    this.game = new Battlegis(_.cloneDeep(this.config));
    this.game.level('arena' || params.level);
    this.game.run();
    this.id = params.id;
    this.game.roomId = params.id;
    this.users = [];
    this.map = this.game.map;

    var self = this;
    this.game.on('frame', function(frame) {
        self.emit('frame', frame);
    });

    this.game.on('levelComplete', function() {
        self.nextGame();
    });
};

inherits(Room, EventEmitter);

Room.prototype.dispose = function() {
    this.game.stop();
};

// Законнектиться в комнату в качестве спектатора
Room.prototype.join = function(name, pass, ai) {
    console.log('name', name);
    if (this.users[name]) return;

    this.users[name] = {
        name: name,
        pass: pass,
        ai: ai || '',
        mode: 'spectator'
    };
};

// Уйти из комнаты совсем
Room.prototype.disconnect = function(name, pass) {
    delete this.users[name];
};

// Спектатор с именем name пытается присоединиться к игре
Room.prototype.fight = function(name, pass, ai) {
    var user = this.users[name];
    if (!user) throw new Error('No user ' + name + ' found in the room ' + this.name);
    if (!pass || user.pass != pass) throw new Error('Incorrect sessionId for user ' + name);

    var players = _.filter(this.users, function(user) {
        return user.mode == 'player';
    });

    if (players.length < this.config.maxPlayers) {
        // Находим нашего бота, которого можно исключить в пользу юзерского бота
        // var tempBot = _.find(this.game.bots, function(bot) {
        //     return bot; // ?
        // });

        // this.game.remove(tempBot);
        this.game.add({
            name: name,
            ai: ai
        });
        this.users[name].mode = 'player';
    } else {
        // Число игроков уже дофига, ограничиваем текущий матч 3 минутами
        this.game.timeout(3 * 60 * 1000);
        this.queue.push(this.users[name]);

        return this.queue.length;
    }
};

// Уйти с карты но остаться в комнате
Room.prototype.spectate = function(name, pass) {
    this.users[name].mode = 'spectator';
    this.game.remove(name);
};

// Запустить следующую игру
Room.prototype.nextGame = function() {
    if (this.queue.length) {
        // Игроки, которые попадут в новую игру
        var queuedPlayers = this.queue.splice(0, - this.config.maxPlayers - this.config.saveBestPlayersNum);

        var worstPlayers = _.filter(this.game.bots, function(bot) {
            return bot.kill * 1000000 - bot.death;
        }, this).slice(0, this.config.maxPlayers - this.config.saveBestPlayersNum);

        this.queue = this.queue.concat(worstPlayers); // Удалённых игроков ставим в конец очереди

        _.each(worstPlayers, function(botToRemove) {
            this.remove(botToRemove);
        }, this);

        _.each(queuedPlayers, function(botToAdd) {
            this.add(botToAdd);
        }, this);
    }

    this.game.restart();
};

Room.prototype.replaceAI = function() {};

module.exports = Room;