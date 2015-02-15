$(function() {
    $('.ai__send').on('click', function() {
        var code = window.editor.getSession().getValue(); // Весь текст
        game.restart();
        game.replaceAI('Твой танк', code);
    });

    window.editor.on('change', function(e) {
        // var code = window.editor.getSession().getValue(); // Весь текст
        // game.replaceAI('you', code);
    });

    var socket = io.connect('http://localhost:3010');
    socket.emit('enter', {roomName: 'dima'});
    socket.on('frame', function (data) {
        console.log(data);
    });
});