var _ = require('lodash');
var botUtils = require('../bot');
var sinon = require('sinon');
var assert = require('assert');

describe('Приватные методы бота', function() {
    describe('eachSegment', function() {
        it('Callback called for each segment', function() {
            var spy = sinon.spy();
            var fakeBot = {
                angle: [0, 1]
            };

            botUtils.eachSegment.call(fakeBot, spy);

            sinon.assert.callCount(spy, 4);
        });
    });
});