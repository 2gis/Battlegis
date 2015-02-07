$(function() {
    function toggle(modules, show) {
        var method = show ? 'addClass' : 'removeClass';

        if (!_.isArray(modules)) {
            modules = [modules];
        }

        _.each(modules, function(m) {
            $('.' + m)[method]('_opened');
            $('.tabs__' + m)[method]('_opened');
        });
        
    }

    $('.tabs__game').click(function() {
        toggle('ai', false);
        toggle('game', !$(this).hasClass('_opened'));
    });

    $('.tabs__ai').click(function() {
        toggle('game', false);
        toggle('ai', !$(this).hasClass('_opened'));
    });

    $('.tabs__map').click(function() {
        // toggle(['game', 'ai'], false);
        toggle('map', !$(this).hasClass('_opened'));
    });
});