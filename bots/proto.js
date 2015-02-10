var _ = require('lodash');

var vector = require('../engine/vutils').vector;

var cp;

var protoBot = function(params) {
    params = params || {};

    this.x = params.x;
    this.y = params.y;
    this.width = params.width;
    this.height = params.height;
    this.name = params.name;
    cp = params.cp;
};

protoBot.prototype = {};

// Движение влево, вверх, вправо или вниз
protoBot.prototype.move = function(direction) {
    if (!_.contains(['left', 'up', 'right', 'down'], direction)) return;

    this.direction = direction;

    cp.want(this, 'move', {
        direction: direction,
        vector: vector(direction)
    });
};

protoBot.prototype.left = function() {
    return this.move('left');
};

protoBot.prototype.up = function() {
    return this.move('up');
};

protoBot.prototype.right = function() {
    return this.move('right');
};

protoBot.prototype.down = function() {
    return this.move('down');
};

// Выстрел в точку с координатами x, y
protoBot.prototype.fire = function(direction) {
    return cp.want(this, 'fire');
};

protoBot.prototype.nitro = function() {
    return cp.want(this, 'nitro');
};

protoBot.prototype.pursue = function(e) {
    var enemy = e || this.enemy;
    var deltaX = this.x - enemy.x;
    var deltaY = this.y - enemy.y;

    // if (Math.abs(deltaY) < Math.abs(deltaX) || Math.abs(deltaX) < 1) {
    if (Math.abs(deltaY) < Math.abs(deltaX) && Math.abs(deltaY) > 2 || Math.abs(deltaX) < 2) {
        if (deltaY < 0) return this.move('down');
        else return this.move('up');
    } else {
        if (deltaX < 0) return this.move('right');
        else return this.move('left');
    }
};

// Отвечает на вопрос: противник на мушке?
protoBot.prototype.locked = function(enemy, eps) {
    enemy = enemy || this.enemy;
    eps = _.isNumber(eps) ? eps : 1;
    
    var deltaX = this.x - enemy.x;
    var deltaY = this.y - enemy.y;

    return Math.abs(deltaX) < eps || Math.abs(deltaY) < eps;
};

// Пытается убежать на максимальную диагональ
protoBot.prototype.escape = function(from) {
    this.enemy = from || this.enemy;
    from = from || this.enemy;
    
    // Для учета краевых эффектов вводим эффективное положение бота
    var effX = this.x; if (effX < 6) effX = 6; if (effX > this.map.size.x - 11) effX = 11;
    var effY = this.y; if (effY < 6) effY = 6; if (effY > this.map.size.y - 11) effY = 11;
    deltaX = effX - from.x;
    deltaY = effY - from.y;

    if (Math.abs(deltaX) < Math.abs(deltaY)) {
        // Если ты справа от него и не у левой границы карты
        if (deltaX < 0) this.left();
        else this.right();
    } else {
        // Если ты снизу от него и не у верхней границы карты
        if (deltaY < 0) this.up();
        else this.down();
    }
};

module.exports = protoBot;