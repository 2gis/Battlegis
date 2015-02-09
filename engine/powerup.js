var _ = require('lodash');
var config = require('../config');

exports.status = function(bot) {
    if (bot.health <= 0) return;

    _.each(bot.powerups, function(value, key) {
        if (_.isFinite(bot.powerups[key]) && bot.powerups[key] > 0) bot.powerups[key]--;
    }, this);

    _.each(this.map.powerups, function(powerup) {
        // Наезд бота на поверап - взятие
        if (powerup.appearIn == 0 && // Если поверап есть на карте
            Math.abs((powerup.x + powerup.width / 2) - (bot.x + bot.width / 2)) < (powerup.width + bot.width) / 2 && 
            Math.abs((powerup.y + powerup.height / 2) - (bot.y + bot.height / 2)) < (powerup.height + bot.height) / 2) {

            bot.powerups[powerup.type] = 25;
            powerup.appearIn = powerup.timeout;
        } else if (_.isFinite(powerup.appearIn) && powerup.appearIn > 0) {
            powerup.appearIn--;
        }
    }, this);
};

// Дефолтные настройки поверапов
exports.config = {
    '2gisDamage': {
        point: [47.5, 57.5],
        timeout: 50,
        leading: false,
        width: config.tankSize,
        height: config.tankSize
    }
};