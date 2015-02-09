module.exports = function() {
    var moves = ['left', 'up', 'right', 'down'];
    var method = moves[Math.round(Math.random() * 4)];

    method = method || 'left';
    this[method]();
    this.fire();
};