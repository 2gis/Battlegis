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
        end: function(frame) {
            return false;
        }
    },

    '0': {
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
        end: function(frame) {
            return frame && frame.players[1].health <= 0;
        }
    },

    '1': {
        map: {
            size: {x: 120, y: 100},
            spawnPoints: [{
                x: 30,
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
        end: function(frame) {
            return frame && frame.players[1].health <= 0;
        }
    },

    '2': {
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
        }]
    }
};