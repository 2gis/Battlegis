module.exports = {
    'test': {
        map: {
            size: {x: 80, y: 60},
            spawnPoints: [{
                x: 0,
                y: 0
            }, {
                x: 195,
                y: 0
            }, {
                x: 195,
                y: 155
            }, {
                x: 0,
                y: 155
            }]
        },
        bots: [{
            name: 'dedal',
            spawnPoint: 0
        }, {
            name: 'dedal'
        }, {
            name: 'another dedal',
            ai: 'dedal'
        }, {
            name: 'weee',
            ai: 'drift'
        }]
    },
    'canvas': {
        map: {
            size: {x: 120, y: 100},
            spawnPoints: [{
                x: 57.5,
                y: 65,
                direction: 'up'
            }, {
                x: 33,
                y: 17,
                direction: 'right'
            }, {
                x: 0,
                y: 0,
                direction: 'right'
            }]
        },
        bots: [{
            name: 'you',
            ai: 'pig',
            spawn: 0
        }, {
            name: 'dedal',
            ai: 'dedal',
            spawn: 1,
            immortal: 0,
            lives: 1
        }],
        success: function(frame) {
            return false;
        }
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
            name: 'you',
            spawn: 0
        }],
        success: function(frame, map) {
            return frame && (frame.players[0].x < 1 || frame.players[0].y < 1 ||
                frame.players[0].x > map.size.x - 1 || frame.players[0].y > map.size.y - 1);
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
            name: 'you',
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
            name: 'you',
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
            name: 'you',
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
            name: 'you',
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
            name: 'you',
            spawn: 0
        }, {
            name: 'chicken',
            ai: 'noop',
            spawn: 1,
            immortal: 0,
            lives: 1
        }],
        powerups: [{
            type: '2gisDamage',
            leading: true,
            x: 30,
            y: 40
        }],
        success: function(frame) {
            return frame && frame.players[0]['2gisDamage'];
        }
    },

    // Бой против ботов
    '7': {
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
            name: 'you',
            spawn: 0
        }, {
            name: 'chicken',
            ai: 'chicken',
            spawn: 1,
            immortal: 0,
            lives: 1
        }, {
            name: 'chicken1',
            ai: 'chicken',
            spawn: 2,
            immortal: 0,
            lives: 1
        }]
    }
};