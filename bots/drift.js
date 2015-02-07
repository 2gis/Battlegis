module.exports = function() {
    if (typeof this.accel == 'undefined') this.accel = 30;
    if (typeof this.num == 'undefined') this.num = 0;

    var dir = ['down', 'up'];
    var main = dir[Number(this.num)];
    var oppos = dir[Number(!this.num)];

    if (this.accel) {
        this.accel--;
        if (this.accel < 5) {
            this[main]();
            this.gear(1);
        }
    } else {
        this[oppos]();
        this.fire();
        this.gear(0);
        if (this.armed < 10) {
            this.num = Number(!this.num);
            this.accel = 30;
        }
    }
};