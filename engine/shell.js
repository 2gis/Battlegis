var _ = require('lodash');

var slot;

var Shell = function(x0, y0, xdest, ydest) {
    params = params || {};

    this.x = x0;
    this.y = y0;
    this.destination = {x: xdest, y: ydest};
};

Shell.prototype = {};

Shell.prototype.dispose = function() {
    
};

module.exports = Shell;