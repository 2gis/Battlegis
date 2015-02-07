

var angles = {
    right: Math.PI/2,
    down: Math.PI,
    left: Math.PI/2*3,
    up: 0
};

var PIXI = require('pixi.js');

function Tank(name, texture) {
    PIXI.DisplayObjectContainer.call(this);

    this.underlay = new PIXI.Graphics();
    this.overlay = new PIXI.Graphics();
    var sprite = this.sprite = new TankSprite(texture);

    var color = randomColor();
    this.health = 100;

    var text = this.text = new PIXI.Text(name, {
        'font': 'normal 11px Arial',
        'fill': '#' + color.toString(16)
    });
    text.rotation = -Math.PI/7.8;
    text.position.x = sprite.width + 0.4;
    text.position.y = -1;

    this.setColor(color);

    this.addChild(this.underlay);
    this.addChild(sprite);
    this.addChild(text);
    this.addChild(this.overlay);
}

// constructor
Tank.prototype = Object.create( PIXI.DisplayObjectContainer.prototype );
Tank.prototype.constructor = Tank;

Tank.prototype.setColor = function(color) {
    this.color = color;
    this.sprite.tint = color;
    this.drawUnderlay();
};

Tank.prototype.setImmortal = function(immortal) {
    this.immortal = immortal;
    this.drawOverlay();
};

Tank.prototype.drawUnderlay = function() {
    var g = this.underlay,
        sprite = this.sprite;

    var w = sprite.width,
        h = sprite.height;

    g.clear();
    g.beginFill(this.color, 1);
    g.drawRect(0, 0, w, h);

    g.beginFill(0xFF0000, 1);
    g.drawRect(0, -5, this._health*w, 2);

    g.endFill();
};

Tank.prototype.drawOverlay = function() {
    var g = this.overlay,
        sprite = this.sprite;

    var w = sprite.width,
        h = sprite.height;

    g.clear();
    if (this.immortal) {
        g.lineStyle(2, 0xFFFFFF, 0.66);
        g.drawCircle(w/2, h/2, w*0.8);
    }
};

Tank.prototype.rotate = function(dir) {
    this.sprite.rotation = angles[dir] || 0;
};

Object.defineProperty(Tank.prototype, 'health', {
    get: function() {
        return this._health*100;
    },
    set: function(percent) {
        this._health = percent/100;
        this.drawUnderlay();
    }
});

function TankSprite(texture) {
    PIXI.Sprite.call(this, texture);

    this.anchor.set(0.5, 0.5);
    this.width = 25;
    this.height = 25;

    this.position.x = 25*0.5;
    this.position.y = 25*0.5;
}

// constructor
TankSprite.prototype = Object.create( PIXI.Sprite.prototype );
TankSprite.prototype.constructor = TankSprite;

function randi(start, stop) {
    return start + Math.floor(Math.random()*(stop - start));
}


function randomColor() {
    var colors = [0x88 ,0x99, 0xFF];

    return (colors[randi(0, 2)] << 16) +
        (colors[randi(0, 2)] << 8) +
        colors[randi(0, 2)];
}

module.exports = Tank;
