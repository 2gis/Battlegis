module.exports = {
    'arena': {
        map: {
            size: {x: 160, y: 160},
            spawnPoints: [
                {x: 10, y: 10},
                {x: 20, y: 20},
                {x: 30, y: 30},
                {x: 40, y: 40},
                {x: 50, y: 50},
                {x: 60, y: 60},
                {x: 70, y: 70},
                {x: 90, y: 90},
                {x: 100, y: 100},
                {x: 110, y: 110},
                {x: 120, y: 120},
                {x: 130, y: 130},
                {x: 140, y: 140},
                {x: 150, y: 150},
            ]
        },
        bots: [{
            name: 'some',
            ai: 'chicken'
        }, {
            name: 'undermind',
            ai: 'undermind'
        }, {
            name: 'undermind2',
            ai: 'undermind'
        }, {
            name: 'Грёбаный капец!',
            ai: 'undermind'
        }],
        powerups: [{
            type: '2gisDamage',
            leading: true,
            x: 77.5,
            y: 77.5
        }]
    },

    // Доехать до края
    '1': {
        map: {
            size: {x: 120, y: 100},
            spawnPoints: [{
                x: 57.5,
                y: 65,
                direction: 'up'
            }, {
                x: 57.5,
                y: 15,
                direction: 'right'
            }]
        },
        bots: [{
            name: 'Твой танк',
            spawn: 0
        }],
        success: function(frame, map) {
            return frame && (frame.players[0].x < 1 || frame.players[0].y < 1 ||
                frame.players[0].x > map.size.x - 6 || frame.players[0].y > map.size.y - 6);
        },
        fail: function(frame, map) {
            return this._gameTicks > 200;
        }
    },

    // Стрельнуть перед собой
    '2': {
        map: {
            size: {x: 120, y: 100},
            spawnPoints: [{
                x: 57.5,
                y: 65,
                direction: 'up'
            }, {
                x: 57.5,
                y: 15,
                direction: 'right'
            }]
        },
        bots: [{
            name: 'Твой танк',
            spawn: 0
        }, {
            name: 'cow',
            spawn: 1,
            immortal: 0,
            lives: 1
        }],
        success: function(frame) {
            return frame && frame.players[1].health <= 0;
        }
    },

    // Убить двух неподвижных
    '3': {
        map: {
            size: {x: 120, y: 100},
            spawnPoints: [{
                x: 57.5,
                y: 65,
                direction: 'up'
            }, {
                x: 10,
                y: 65,
                direction: 'right'
            }, {
                x: 85,
                y: 65,
                direction: 'left'
            }]
        },
        bots: [{
            name: 'Твой танк',
            spawn: 0
        }, {
            name: 'cow',
            spawn: 1,
            immortal: 0,
            lives: 1
        }, {
            name: 'cow2',
            spawn: 2,
            immortal: 0,
            lives: 1
        }],
        success: function(frame) {
            return frame && frame.players[1].health <= 0 && frame.players[2].health <= 0;
        }
    },

    // Доехать и убить
    '4': {
        map: {
            size: {x: 120, y: 100},
            spawnPoints: [{
                x: 30,
                y: 65,
                direction: 'up'
            }, {
                x: 57.5,
                y: 45,
                direction: 'right'
            }]
        },
        bots: [{
            name: 'Твой танк',
            spawn: 0
        }, {
            name: 'cow',
            ai: 'noop',
            spawn: 1,
            immortal: 0,
            lives: 1
        }],
        success: function(frame) {
            return frame && frame.players[1].health <= 0;
        }
    },

    // Догнать и убить 
    '5': {
        map: {
            size: {x: 120, y: 100},
            spawnPoints: [{
                x: 30,
                y: 65,
                direction: 'up'
            }, {
                x: 57.5,
                y: 45,
                direction: 'right'
            }]
        },
        bots: [{
            name: 'Твой танк',
            spawn: 0
        }, {
            name: 'chicken',
            ai: 'chicken',
            spawn: 1,
            immortal: 0,
            lives: 1
        }],
        success: function(frame) {
            return frame && frame.players[1].health <= 0;
        }
    },

    // Обогнать и взять 2gis damage
    '6': {
        map: {
            size: {x: 120, y: 100},
            spawnPoints: [{
                x: 57.5,
                y: 85,
                direction: 'up'
            }, {
                x: 57.5,
                y: 10,
                direction: 'down'
            }]
        },
        bots: [{
            name: 'Твой танк',
            spawn: 0
        }, {
            name: 'aaaa',
            ai: 'nitro',
            spawn: 1
        }],
        powerups: [{
            type: '2gisDamage',
            leading: true,
            x: 57.5,
            y: 47.5
        }],
        success: function(frame) {
            return frame && frame.players[0].powerups['2gisDamage'];
        },
        fail: function(frame) {
            return this._gameTicks > 50 && frame && frame.players[1].powerups['2gisDamage'];
        }
    },

    // Обогнать и взять 2gis damage по кривой
    '7': {
        map: {
            size: {x: 120, y: 100},
            spawnPoints: [{
                x: 10,
                y: 85,
                direction: 'up'
            }, {
                x: 85,
                y: 10,
                direction: 'down'
            }]
        },
        bots: [{
            name: 'Твой танк',
            spawn: 0
        }, {
            name: 'aaaa',
            ai: 'drift',
            spawn: 1
        }],
        powerups: [{
            type: '2gisDamage',
            leading: true,
            x: 57.5,
            y: 47.5
        }],
        success: function(frame) {
            return frame && frame.players[0].powerups['2gisDamage'];
        },
        fail: function(frame) {
            return this._gameTicks > 150 && frame && frame.players[1].powerups['2gisDamage'];
        }
    },

    // Бой против ботов
    '8': {
        map: {
            size: {x: 120, y: 100},
            spawnPoints: [{
                x: 20,
                y: 20,
                direction: 'up'
            }, {
                x: 20,
                y: 75,
                direction: 'right'
            }, {
                x: 95,
                y: 75,
                direction: 'right'
            }, {
                x: 95,
                y: 20,
                direction: 'right'
            }]
        },
        bots: [{
            name: 'Твой танк',
            spawn: 0
        }, {
            name: 'undermind',
            ai: 'undermind',
            spawn: 1
        }, {
            name: 'undermind2',
            ai: 'undermind',
            spawn: 2
        }, {
            name: 'Грёбаный капец!',
            ai: 'undermind',
            spawn: 3,
            immortal: 0
        }],
        powerups: [{
            type: '2gisDamage',
            leading: true,
            x: 57.5,
            y: 47.5
        }]
    }
};