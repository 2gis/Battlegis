// direction = ['up', 'down', 'left', 'right'] - направление в котором смотрит танк

var isServer = typeof window == 'undefined';
var vm = require('vm');

var _ = require('lodash');
var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var lineIntersect = require("line-intersect");
var botUtils = require('./bot');

var vutils = require('./vutils');

var ProtoBot = require('./protoBot');

inherits(Engine, EventEmitter);
function Engine(config) {
    EventEmitter.call(this);

    this.config = config || {};
    this.history = {};

    _.defaults(this.config, require('./defaultConfig'));

    this.bots = []; // Массив дескрипторов загруженных на карту ботов, написанных игроками
    this.update = config.update || function() {};
    this.history.bots = {};
}

var powerupCode = require('./powerup');

// Инициализация игры: загрузка ботов, конфига
Engine.prototype.level = function(levelName) {
    this._levelName = levelName;
    var levels = require('./levels');
    var level = _.isObject(levelName) ? levelName : levels[levelName];

    if (!level) return;

    this.bots = [];
    this.shells = [];
    this._gameTicks = 0;

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
    this.fail = level.fail || _.noop;
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
    this._gameTicks = 0;

    function tick() {
        // Расчет перемещений всех объектов на карте
        var lastFrame = _.last(this.history.frames);
        if (this.stage < 10) {
            if (this.success.call(this, lastFrame, this.map) || this._timeout <= 0) {
                this.stage = 10;
                this.emit('levelComplete');
            } else if (this.fail.call(this, lastFrame, this.map)) {
                this.stage = 10;
                this.emit('levelFail');
            }
        }
        if (this.stage < 10) this.ai();
        this.push();
        this.kinetic();

        this._gameTicks++;
        if (this._timeout) this._timeout--; // Условие выхода из игры по времени

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

    this.add(botParams);
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
Engine.prototype.add = function(params) {
    var direction = params.direction || 'up';

    var bot = {
        id: params.id || Math.round(Math.random() * Number.MAX_SAFE_INTEGER / 10),
        ai: params.ai,
        index: this.bots.length,
        name: params.name,
        angle: vutils.vector(direction),
        vector: vutils.vector(direction),
        direction: direction,
        width: 5,
        height: 5,
        kill: params.kill || 0,
        death: params.death || 0,
        eachSegment: botUtils.eachSegment,
        health: 100,
        armed: 30,
        stamina: 60,
        powerups: {},
        immortal: _.isNumber(params.immortal) ? params.immortal : this.config.immortal,
        spawn: params.spawn || 0,
        lives: params.lives || Infinity
    };

    this._chooseSpawnPoint(bot);
    bot.instance = new ProtoBot({
        id: bot.id,
        x: bot.x,
        y: bot.y,
        width: bot.width,
        height: bot.height,
        name: params.name,
        cp: {
            want: this.want.bind(this)
        }
    });

    if (isServer) {
        var str = _.isFunction(bot.ai) ? bot.ai.toString().match(/function[^{]+\{([\s\S]*)\}$/)[1] : bot.ai; // Выдираем тело функции в строку
        bot.instance = vm.createContext(bot.instance);
        bot.ai = new vm.Script(str);
    }

    this.bots.push(bot);
};

// Удалить бота из игры
Engine.prototype.remove = function(bot) {
    var name = bot.name || bot;
    var length = this.bots.length;

    _.remove(this.bots, function(bot) {
        return bot.name == name;
    }, this);

    return length - this.bots.length - 1; // 0 если был удалён 1 бот
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
                                this.emit('score', this.getScore());
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

        var inertion = 1; // Инерция танка, то есть неспособность менять направление движения
        // var v2 = bot.vector[0] * bot.vector[0] + bot.vector[1] * bot.vector[1];

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
            bot.gear = 0;
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

Engine.prototype.timeout = function(ms) {
    this._timeout = ms;
};

// Выполнение ИИ функций ботов
Engine.prototype.ai = function() {
    var frame = _.cloneDeep(_.last(this.history.frames));

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
        bot.instance.powerups = _.cloneDeep(bot.powerups);

        try {
            // На сервере исполняем ai в виртуальной машине
            if (isServer) {
                bot.ai.runInContext(bot.instance, {
                    filename: bot.name + '.bot',
                    timeout: this.config.aiTimeout
                });
            } else {
                bot.ai.call(bot.instance);
            }
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
        str = 'var tank = this, map = this.frame;' + str;
        var oldAI = bot.ai;
        try {
            if (isServer) {
                bot.ai = new vm.Script(str);
            } else {
                bot.ai = new Function(str);
            }
        } catch (e) {
            console.log('Error! Bot ' + name + ' ai was not replaced');
            bot.ai = oldAI;
        }
    }
};

// Запоминает новый кадр сражения в массив this.history.frames
Engine.prototype.push = function() {
    this.history.frames = this.history.frames || [];

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

    var powerups = _.cloneDeep(this.map.powerups);

    // Сохраняем в историю (в кадр) все данные чтоб потом их можно было передать клиенту
    var frame = {
        players: players,
        shells: shells,
        powerups: powerups,
        time: Date.now()
    };

    this.history.frames.push(frame);
    this.update(this.get({
        since: frame.time - 1 // вернёт только последний фрейм
    }));
    this.emit('frame', frame);
};

// Реквест бота на выполнение какого-то действия, которое может быть и не доступно (например второй выстрел сразу после первого)
Engine.prototype.want = function(instance, action, params) {
    var bot = _.find(this.bots, function(bot) {
        return instance.id === bot.id;
    });

    if (!bot) {
        console.log('this.bots', _.pluck(this.bots, 'id'), instance.id, this.roomId);
        // throw new Error('Bot with id "' + instance.id + '" not found');
        return;
    }

    if (action == 'fire') {
        bot.immortal = 0; // Выключаем бессмертие после первой попытки выстрелить

        if (bot.armed < 10) return;

        bot.armed -= 10;

        this.shells = this.shells || [];
        this.shells.push({
            id: Math.round(Math.random() * Number.MAX_SAFE_INTEGER / 10),
            x: bot.x + bot.width * 0.5 + bot.angle[0] * bot.width * 0.5,
            y: bot.y + bot.height * 0.5 + bot.angle[1] * bot.height * 0.5,
            vector: bot.angle,
            parent: bot,
            strength: 40
        });

        // Отдача
        bot.vector[0] -= bot.angle[0] * 2;
        bot.vector[1] -= bot.angle[1] * 2;
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

Engine.prototype.getScore = function() {
    var score = _.map(this.bots, function(bot) {
        return _.pick(bot, 'id', 'name', 'kill', 'death');
    }, this);

    return score;
};

// Возвращает состояния игры и последних кадров сражения
Engine.prototype.get = function(params) {
    if (!this.map) return;

    var frames = _.filter(this.history.frames, function(frame) {
        return frame.time > params.since;
    });

    return {
        map: {
            size: this.map.size
        },
        frames: frames
    };
};

module.exports = Engine;
