module.exports = function(map) {
    var moves = ['left', 'up', 'right', 'down'];
    this.movNum = this.movNum || 0;

    if (!this.count) {
        var method = moves[this.movNum++ % 4];
        this.method = method;
        this.count = 10;
    }
    this[this.method]();

    this.count--;
};