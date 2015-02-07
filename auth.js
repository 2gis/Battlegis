var config = require('./config');

module.exports = function(name, pass) {
    var expectedPass = config.auth[name];
    
    return {
        resolve: function(successCallback) {
            if (expectedPass && expectedPass == pass) {
                successCallback();
            }

            return this;
        }
    }
};