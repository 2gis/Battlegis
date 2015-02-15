var _ = require('lodash');

var Battlegis = require('./engine');
var config = require('./config');

var Room = function(params) {
    this.name = params.name || 'room' + Math.random() * Math.MAX_SAFE_INTEGER;

    this.config = params.config || config;
    this.game = new Battlegis(this.config);
    this.game.level('arena' || params.level);
    this.game.run();

    var self = this;
    this.game.on('levelEnd', function() {
        self.nextGame();
    });
};

Room.prototype.dispose = function() {
    this.game.stop();
};

// Законнектиться в комнату в качестве спектатора
Room.prototype.connect = function(name, pass, ai) {
    if (this.users[name]) return;

    this.users[name] = {
        name: name,
        pass: pass,
        ai: ai || '',
        mode: 'spectator'
    };
};

// Спектатор с именем name пытается присоединиться к игре
Room.prototype.join = function(name) {
    if (!this.users[name]) throw new Error('No user ' + name + ' found in the room ' + this.name);

    var players = _.filter(this.users, function(user) {
        return user.mode == 'player';
    });

    if (players.length < this.config.maxPlayers) {
        // Находим нашего бота, которого можно исключить в пользу юзерского бота
        var tempBot = _.find(this.game.bots, function(bot) {
            return bot; // ?
        });

        game.remove(tempBot);
        game.add(this.users[name]);
        this.users[name].mode = 'player';
    } else {
        // Число игроков уже дофига, ограничиваем текущий матч 3 минутами
        game.timeout(3 * 60 * 1000);
        this.queue.push(this.users[name]);
    }
};

// Запустить следующую игру
Room.prototype.nextGame = function() {
    // Игроки, которые попадут в новую игру
    var queuedPlayers = this.queue.splice(0, - this.config.maxPlayers - this.config.saveBestPlayersNum);

    var worstPlayers = _.filter(game.bots, function(bot) {
        return bot.kill * 1000000 - bot.death;
    }, this).slice(0, this.config.maxPlayers - this.config.saveBestPlayersNum);

    this.queue = this.queue.concat(worstPlayers); // Удалённых игроков ставим в конец очереди

    _.each(worstPlayers, function(botToRemove) {
        this.remove(botToRemove);
    }, this);

    _.each(queuedPlayers, function(botToAdd) {
        this.add(botToAdd);
    }, this);

    this.game.restart();
};