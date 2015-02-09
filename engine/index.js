// direction = ['up', 'down', 'left', 'right'] - направление в котором смотрит танк

var _ = require('lodash');
var lineIntersect = require("line-intersect");
var botUtils = require('./bot');

var vutils = require('./vutils');

var gameHistory = {};
var listeners = {};

var ProtoBot = require('../bots/proto');
var Shell = require('./shell');

var Engine = function(config) {
    this.config = config || {};

    _.defaults(this.config, require('./defaultConfig'));

    this.bots = []; // Массив дескрипторов загруженных на карту ботов, написанных игроками
    this.update = config.update || function() {};
    gameHistory.bots = {};
};

var powerupCode = require('./powerup');

Engine.prototype = {};

// Инициализация игры: загрузка ботов, конфига
Engine.prototype.level = function(levelName) {
    this._levelName = levelName;
    var levels = require('./levels');
    var level = levels[levelName];

    if (!level) return;

    this.bots = [];
    this.shells = [];

    if (level.map) {
        this.map = _.cloneDeep(level.map);
    }
    if (!this.map.spawnPoints) { // Дефолтные точки спавна - по углам карты
        this.map.spawnPoints = [
            {x: 0, y: 0},
            {x: this.map.size.x - this.config.tankSize, y: 0},
            {x: this.map.size.x - this.config.tankSize, y: this.map.size.y - this.config.tankSize},
            {x: 0, y: this.map.size.y - this.config.tankSize}
        ];
    }

    _.each(level.bots, function(bot) {
        this.spawn(_.clone(bot));
    }, this);

    // Спавним поверапы
    this.map.powerups = _.map(level.powerups, function(powerupCfg) {
        var powerup = _.cloneDeep(powerupCfg);
        powerup = _.defaults(powerup, powerupCode.config[powerupCfg.type] || {});

        if (powerup.leading) powerup.appearIn = 0; // Ставим перк на карту сразу
        else powerup.appearIn = powerup.timeout;

        return powerup;
    }, this);

    this.success = level.success || _.noop;
    this.stage = 1;
};

Engine.prototype.restart = function() {
    this.emit('levelRestart');
    this.level(this._levelName);
};

// Запуск игры
Engine.prototype.run = function(config) {
    var self = this;

    this.stage = 1;

    function tick() {
        // Расчет перемещений всех объектов на карте
        if (this.success(_.last(gameHistory.frames), this.map)) {
            this.stage = 10;
            this.emit('levelComplete');
        }
        if (this.stage < 10) this.ai();
        this.push();
        this.kinetic();

        this.tickTimeout = setTimeout(function() {
            tick.call(self);
        }, this.config.tick);
    }

    this.push();
    tick.call(self);
};

Engine.prototype.stop = function() {
    clearTimeout(this.tickTimeout);
};

// Загрузка игроков на карту
Engine.prototype.spawn = function(params) {
    var ai = params.ai || 'noop';
    var botAI = require('../bots/' + ai + '.js');
    var botParams = _.extend({}, params, {
        ai: botAI,
        kill: params.kill || 0,
        death: params.death || 0,
        direction: this.map.spawnPoints[params.spawn || 0].direction || [0, -1],
        lives: params.lives || Infinity
    });

    this.addBot(botParams);
};

// Убивает всех в прямоугольнике
Engine.prototype._telefrag = function(bot) {
    // Убиваем всех кто оказался в зоне спавна в момент спавна
    return _.each(this.bots, function(obot) {
        if (bot != obot &&
            Math.abs((obot.x + obot.width / 2) - (bot.x + bot.width / 2)) < (obot.width + bot.width) / 2 && 
            Math.abs((obot.y + obot.height / 2) - (bot.y + bot.height / 2)) < (obot.height + bot.height) / 2) {
            obot.health = 0;
            obot.ticksToRespawn = this.config.respawn;
            obot.death++;
            bot.lives--;
            bot.kill++;
        }
    }, this);
};

// Ищет подходящее для спавна случайное место
Engine.prototype._chooseSpawnPoint = function(bot) {
    var spawnPointNum = _.isNumber(bot.spawn) ? bot.spawn : _.random(this.map.spawnPoints.length - 1);
    var spawn = this.map.spawnPoints[spawnPointNum];
    bot.x = spawn.x;
    bot.y = spawn.y;

    this._telefrag(bot);

    return;
};

// Пересоздаёт убитого бота, по сути просто меняет его позицию
Engine.prototype.respawn = function(bot) {
    if (bot.lives <= 0) return;

    bot.ticksToRespawn--;

    if (bot.ticksToRespawn) return; // Время до рождения

    this._chooseSpawnPoint(bot);
    bot.health = 100;
    bot.armed = 30;
    bot.stamina = 30;
    bot.immortal = this.config.immortal; // Тиков до отключения бессмертия
    bot.powerups = {};
};

// Добавление бота в игру
Engine.prototype.addBot = function(params) {
    var direction = params.direction || 'up';

    var bot = {
        id: params.id || Math.round(Math.random() * Number.MAX_SAFE_INTEGER),
        ai: params.ai,
        index: this.bots.length,
        name: params.name,
        angle: vutils.vector(direction),
        vector: vutils.vector(direction),
        direction: direction,
        width: 5,
        height: 5,
        kill: params.kill,
        death: params.death,
        eachSegment: botUtils.eachSegment,
        health: 100,
        armed: 30,
        stamina: 60,
        powerups: {},
        immortal: _.isNumber(params.immortal) ? params.immortal : this.config.immortal,
        spawn: params.spawn,
        lives: params.lives
    };

    this._chooseSpawnPoint(bot);
    bot.instance = new ProtoBot({
        x: bot.x,
        y: bot.y,
        width: bot.width,
        height: bot.height,
        name: params.name,
        cp: {
            want: this.want.bind(this)
        }
    });

    this.bots.push(bot);

    gameHistory.bots[params.name] = {};
};

// Обсчет всей кинетики игры: пересчёт позиций всех объектов
Engine.prototype.kinetic = function() {
    this.shellsPositions();
    this.playersPositions();
};

// Обновление позиции всех снарядов. Направление меняться не может
Engine.prototype.shellsPositions = function() {
    // Удаляем старые только после того, как удалённые улетели на клиента (сохранились в gameHistory)
    this.shells = _.reject(this.shells, function(shell) {
        return shell.bursted;
    });

    _.each(this.shells, function(shell, index) {
        var x = shell.x + shell.vector[0] * 18; // Новые координаты снаряда
        var y = shell.y + shell.vector[1] * 18;

        var wantX = x, wantY = y;

        // Валидация новых координат снаряда
        if (x <= 0 || y <= 0 || x >= this.map.size.x || y >= this.map.size.y) {
            if (x < 0) x = 0;
            if (y < 0) y = 0;

            if (x > this.map.size.x) x = this.map.size.x;
            if (y > this.map.size.y) y = this.map.size.y;

            shell.bursted = true;
        } else {
            // Столкновение снаряда с танком
            _.each(this.bots, function(bot) {
                if (bot.ticksToRespawn || shell.parent == bot) return;

                bot.eachSegment(function(b0, b1, type) {
                    if (bot.ticksToRespawn) return; // Уже учли пересечение

                    var intersect = lineIntersect.checkIntersection(
                        shell.x, shell.y, x, y,
                        b0[0], b0[1], b1[0], b1[1]
                    );

                    if (intersect.point) {
                        if (!bot.immortal) {
                            bot.health -= shell.strength;
                            if (bot.health <= 0) {
                                bot.ticksToRespawn = this.config.respawn;
                                bot.death++;
                                bot.lives--;
                                shell.parent.kill++;
                            }
                        }
                        shell.bursted = true;

                        // останавливаем пулю в точке пересечения
                        x = intersect.point.x;
                        y = intersect.point.y;
                    }
                }, this);
            }, this);
        }

        // считаем насколько мы скорректировали пулю/
        // а точнее насколько меньший путь проделала пуля
        var kx = (x - shell.x)/(wantX - shell.x);
        var ky = (y - shell.y)/(wantY - shell.y);
        shell.k = isFinite(kx) ? kx : ky;

        shell.x = x;
        shell.y = y;
        shell.strength = shell.strength * .95; // Уменьшение силы снаряда с расстоянием
    }, this);

    this.bots = _.each(this.bots, function(bot) {
        if (bot.ticksToRespawn) {
            this.respawn(bot);
        }
    }, this);
};

// Обновление позиции всех танков
Engine.prototype.playersPositions = function() {
    _.each(this.bots, function(bot) {
        if (bot.immortal) bot.immortal--;

        if (bot.ticksToRespawn) return;

        var inertion = 0; // Инерция танка, то есть неспособность менять направление движения
        var v2 = bot.vector[0] * bot.vector[0] + bot.vector[1] * bot.vector[1];
        var speed = Math.sqrt(v2);
        if (v2 > 10) {
            inertion = v2 / 8; // на 1 и 2 скорости
        }

        // Тяга
        var force = bot.nitro ? 2 : 0;
        bot.gear += force;
        var traction = [bot.angle[0] * bot.gear, bot.angle[1] * bot.gear];
        bot.vector[0] = (inertion * bot.vector[0] + traction[0]) / (inertion + 1);
        bot.vector[1] = (inertion * bot.vector[1] + traction[1]) / (inertion + 1);
        if (Math.abs(bot.vector[0] - traction[0]) < .1) bot.vector[0] = traction[0];
        if (Math.abs(bot.vector[1] - traction[1]) < .1) bot.vector[1] = traction[1];

        var x = bot.x + bot.vector[0];
        var y = bot.y + bot.vector[1];

        if (x < 0) x = 0;
        if (y < 0) y = 0;
        if (x > this.map.size.x - bot.width) {
            x = this.map.size.x - bot.width;
            bot.vector[0] = 0;
        }
        if (y > this.map.size.y - bot.height) {
            y = this.map.size.y - bot.height;
            bot.vector[1] = 0;
        }

        // Пересечения ботов между собой (наезд друг на друга)
        var boom = _.any(this.bots, function(obot) {
            return obot != bot &&
                !obot.ticksToRespawn &&
                Math.abs((obot.x + obot.width / 2) - (x + bot.width / 2)) < (obot.width + bot.width) / 2 && 
                Math.abs((obot.y + obot.height / 2) - (y + bot.height / 2)) < (obot.height + bot.height) / 2;
        });

        if (boom) {
            bot.vector = [0, 0]; // @TODO правильно обнулять // @TODO запилить физику
        } else {
            bot.x = bot.instance.x = x;
            bot.y = bot.instance.y = y;
        }

        // Захват перков
        this.powerupsStatus(bot);

        bot.armed++;
        if (bot.armed > 30) bot.armed = 30;

        // Пока зажата кнопка ускорения, стамина не восстанавливается + ещё 10 тиков
        if (bot.nitroPressed > 0) {
            bot.nitroPressed--;
        } else {
            bot.stamina++;
            if (bot.stamina > 60) bot.stamina = 60;
        }

        bot.instance.armed = bot.armed;
        bot.instance.immortal = bot.immortal;
        bot.instance.stamina = bot.stamina;
    }, this);
};

Engine.prototype.powerupsStatus = powerupCode.status;

// Выполнение ИИ функций ботов
Engine.prototype.ai = function() {
    var frame = _.cloneDeep(_.last(gameHistory.frames));

    _.each(this.bots, function(bot) {
        if (bot.ticksToRespawn) return;

        bot.gear = bot.gear || 0;
        if (bot.gear > 0) bot.gear--; // Сбрасываем движение
        bot.nitro = false;

        bot.instance.frame = _.cloneDeep(frame);
        bot.instance.frame.players = _.reject(bot.instance.frame.players, function(player) {
            return player.ticksToRespawn || player.id == bot.id;
        }, this);
        bot.instance.enemy = _.find(bot.instance.frame.players, function(obot) {
            return obot.id != bot.id;
        });
        bot.instance._ = _;
        bot.instance.map = _.cloneDeep(this.map);
        bot.instance.health = bot.health;

        try {
            bot.ai.call(bot.instance);
        } catch (e) {
            console.log('ai[%s] call: %s', bot.name, e.stack);
        }
    }, this);
};

// На лету подменяет ai
Engine.prototype.replaceAI = function(name, str) {
    var bot = _.find(this.bots, function(bot) {
        return bot.name == name;
    });

    if (bot) {
        var oldAI = bot.ai;
        try {
            bot.ai = new Function(str);
        } catch (e) {
            console.log('Error! Bot ' + name + ' ai was not replaced');
            bot.ai = oldAI;
        }
    }
};

// Запоминает новый кадр сражения в массив gameHistory.frames
Engine.prototype.push = function() {
    gameHistory.frames = gameHistory.frames || [];

    var historyKeys = ['id', 'name', 'x', 'y', 'kill', 'death', 'direction', 'health', 'ticksToRespawn', 'immortal'];

    // Делаем копии игроков и снарядов с выбранными полями для сохранения в историю
    var players = _.map(this.bots, function(bot) {
        var botCopy = _.pick(bot, historyKeys);
        botCopy.powerups = _.cloneDeep(bot.powerups);

        return botCopy;
    });
    players = _.compact(players);

    var shells = _.reduce(this.shells, function(result, shell) {
        var pshell = _.pick(shell, ['id', 'x', 'y', 'k', 'bursted']);

        pshell.shooterId = shell.parent.id;
        pshell.vector = _.clone(shell.vector); // clone vector

        result.push(pshell);

        return result;
    }, []);

    var powerups = _.map(this.map.powerups, function(powerup) {
        var out = {};
        out[powerup.type] = powerup.appearIn == 0;
        return out;
    });

    // Сохраняем в историю (в кадр) все данные чтоб потом их можно было передать клиенту
    var frame = {
        players: players,
        shells: shells,
        powerups: powerups,
        time: Date.now()
    };

    gameHistory.frames.push(frame);
    this.update(this.get({
        since: frame.time - 1 // вернёт только последний фрейм
    }));
};

// Реквест бота на выполнение какого-то действия, которое может быть и не доступно (например второй выстрел сразу после первого)
Engine.prototype.want = function(instance, action, params) {
    var bot = _.find(this.bots, function(bot) {
        return instance === bot.instance;
    });

    if (action == 'fire') {
        bot.immortal = 0; // Выключаем бессмертие после первой попытки выстрелить

        if (bot.armed < 10) return;

        bot.armed -= 10;

        this.shells = this.shells || [];
        this.shells.push({
            id: Math.round(Math.random() * Number.MAX_SAFE_INTEGER),
            x: bot.x + bot.width * 0.5 + bot.angle[0] * bot.width * 0.5,
            y: bot.y + bot.height * 0.5 + bot.angle[1] * bot.height * 0.5,
            vector: bot.angle,
            parent: bot,
            strength: 40
        });

        // Отдача
        bot.vector[0] -= bot.angle[0] * 2;
        bot.vector[1] -= bot.angle[1] * 2;

        gameHistory.bots[bot.name].lastFire = Date.now();
    }

    if (action == 'move') {
        bot.angle = params.vector;
        bot.direction = instance.direction;
        bot.gear = bot.gear || 1;
    }

    if (action == 'nitro') {
        if (bot.stamina > 0) {
            bot.nitro = true;
            bot.stamina -= 10;
        }
        bot.nitroPressed = 10;
    }

    this.lastAction = action;
};



// Возвращает состояния игры и последних кадров сражения
Engine.prototype.get = function(params) {
    if (!this.map) return;

    var frames = _.filter(gameHistory.frames, function(frame) {
        return frame.time > params.since;
    });

    return {
        map: {
            size: this.map.size
        },
        frames: frames
    };
};

Engine.prototype.on = function(eventName, callback) {
    listeners[eventName] = listeners[eventName] || [];
    listeners[eventName].push(callback);
}

Engine.prototype.emit = function(eventName) {
    _.each(listeners[eventName], function(listener) {
        listener.call(this);
    }, this);
}

module.exports = Engine;