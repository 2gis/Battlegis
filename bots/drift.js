module.exports = function() {
    var moves = ['down', 'left', 'up', 'right'];
    var quadrant = 1;
    if (this.x > this.map.size.x / 2 && this.y <= this.map.size.y / 2) quadrant = 2;
    if (this.x > this.map.size.x / 2 && this.y > this.map.size.y / 2) quadrant = 3;
    if (this.x <= this.map.size.x / 2 && this.y > this.map.size.y / 2) quadrant = 4;

    this[moves[quadrant - 1]]();
    this.nitro();
};