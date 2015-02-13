var Battlegis = require('./engine');
var battlegis;

exports.init = function(config) {
    battlegis = new Battlegis(config);
};

exports.get = function() {
    return battlegis;
};