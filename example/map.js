var ANIM_DURATION = 200;

var PIXI = require('pixi.js');
var Tank = require('./tank');

$(function() {
    var shells = {};
    var tanks = {};
    var i = 0;
    var map = $('.map');

    var stage = new PIXI.Stage(0x000000);
    var renderer = PIXI.autoDetectRenderer(400, 300);

    var tankTexture = PIXI.Texture.fromImage("assets/tank2.png");

    var underlay = new PIXI.Graphics();
    var tanksLayer = new PIXI.DisplayObjectContainer();

    stage.addChild(underlay);
    stage.addChild(tanksLayer);

    map[0].appendChild(renderer.view);

    window.game = new Battlegis({
        update: function(data) {
            if (data.map.size) {
                var w = data.map.size.x * 5,
                    h = data.map.size.y * 5;
                map.css({
                    width: w,
                    height: h
                });
                renderer.resize(w, h);
            }
            updateMap(data.frames[data.frames.length - 1]);
        }
    });


    function scoreTemplate(data) {
        data = _.sortBy(data, function(player) {
            return -player.kill * 1000 - player.death;
        });
        var rows = _.map(data, function(player) {
            return '<div class="game__scoreRow"><div class="game__scoreCell">' + player.name + '</div><div class="game__scoreCell">' +
                player.kill + '</div><div class="game__scoreCell">' + player.death + '</div></div>'
        });

        return '<div class="game__scoreTable">' + rows.join('') + '</div>';
    }

    function getTank(bot) {
        if (!(bot.id in tanks)) {
            var tank = tanks[bot.id] = new Tank(bot.name, tankTexture);
            tanksLayer.addChild(tank);
        }
        return tanks[bot.id];
    }

    function linear(start, stop, k) {
        return start + k*(stop - start);
    }

    function wantMove(obj, x, y) {
        if (!obj.prev) {
            obj.position.set(x, y);
        } else {
            obj.want = obj.want || new PIXI.Point();
            obj.want.set(x, y);
            obj.wantTime = Date.now();
        }

        obj.prev = obj.position.clone();
    }

    function move(obj, speedFactor) {
        if (!obj.want) {
            // skip
            return;
        }
        var now = Date.now();

        if (speedFactor === void 0) speedFactor = 1;

        var duration = ANIM_DURATION*speedFactor;

        var k = (now - obj.wantTime)/duration;

        if (k > 1) k = 1;

        obj.position.set(
            linear(obj.prev.x, obj.want.x, k),
            linear(obj.prev.y, obj.want.y, k)
        );

        if (k === 1) {
            obj.want = obj.wantTime = null;
        }
    }

    function getShell(id) {
        if (!shells[id]) {
            shells[id] = {
                id: id,
                position: new PIXI.Point()
            };
        }

        return shells[id];
    }

    function killShell(shell) {
        delete shells[shell.id];
    }


    function updateMap(frame) {
        if (!frame) return;

        var score = [];

        _.each(frame.players, function(fplayer, index) {
            var tank = getTank(fplayer);

            wantMove(tank, fplayer.x * 5, fplayer.y * 5);

            tank.rotate(fplayer.direction);

            if (fplayer.ticksToRespawn) {
                // @TODO: animation
                tank.prev = tank.want = null;
                tank.renderable = false;
                tanksLayer.removeChild(tank);
            } else {
                tank.renderable = true;
                tanksLayer.addChild(tank);
            }
            tank.health = fplayer.health;
            tank.setImmortal(fplayer.immortal);

            score[index] = fplayer;
        });

        _.each(frame.shells, function(fshell) {
            var shell = getShell(fshell.id);
            if (!shell.burstedTime) {
                shell.k = isFinite(Number(fshell.k)) ? Number(fshell.k) : 1;

                wantMove(shell, fshell.x * 5, fshell.y * 5);
                if (fshell.bursted) {
                    shell.burstedTime = Date.now();
                }
            }

        });

        $('.game__score').html(scoreTemplate(score));
    }

    function animationFrame() {
        underlay.clear();

        // рисуем ботов

        _.each(game.bots, function(bot) {
            var tank = getTank(bot);
            if (!tank.renderable) return;

            move(tank);
        });

        underlay.beginFill(0xFF0000, 1);

        _.each(shells, function(shell) {
            // если пуля не хочет двигаться, значет она мертва :)
            if (!shell.want && shell.burstedTime) return killShell(shell);

            move(shell, shell.k);
            underlay.drawCircle(shell.position.x, shell.position.y, 3);
        });


        renderer.render(stage);

        requestAnimationFrame(animationFrame);
    }

    var level = 0;
    game.level(level);

    game.on('levelComplete', function(e) {
        tanksLayer.removeChildren();
        underlay.clear();

        shells = {};
        level++;
        game.level(level);
        game.replaceAI('you', window.editor.getSession().getValue());
    });
    setTimeout(function() {
        game.run();
        animationFrame();
    }, 500);
});