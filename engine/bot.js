var _ = require('lodash');

function getType(expAngle, realAngle) {
    function scalar(a, b) {
        return a[0] * b[0] + a[1] * b[1];
    }

    function vector(a, b) {
        return a[1] * b[0] - b[1] * a[0]; // Векторное произведение для _левой системы координат
    }

    var s = scalar(expAngle, realAngle);
    var v = vector(expAngle, realAngle);

    if (s) {
        if (s == 1) return 'front';
        if (s == -1) return 'rear';
    } else if (v) {
        if (v == 1) return 'right';
        if (v == -1) return 'left';
    }

};

exports.eachSegment = function(callback, thisArg) {
    var bot = this;

    type = getType([0, -1], bot.angle);
    callback.call(thisArg, [bot.x, bot.y], [bot.x + bot.width, bot.y], type);

    type = getType([1, 0], bot.angle);
    callback.call(thisArg, [bot.x + bot.width, bot.y], [bot.x + bot.width, bot.y + bot.height], type);

    type = getType([0, 1], bot.angle);
    callback.call(thisArg, [bot.x + bot.width, bot.y + bot.height], [bot.x, bot.y + bot.height], type);

    type = getType([-1, 0], bot.angle);
    callback.call(thisArg, [bot.x, bot.y + bot.height], [bot.x, bot.y], type);
};