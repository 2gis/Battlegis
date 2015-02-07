
exports.vector = function(direction) {
    switch (direction) {
        case 'left': return [-1, 0]; break;
        case 'up': return [0, -1]; break;
        case 'right': return [1, 0]; break;
        case 'down': return [0, 1]; break;
    }
};