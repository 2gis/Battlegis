$(function() {
    $('.ai__send').on('click', function() {
        $.ajax({
            url: '/ai',
            type: 'POST',
            data: {
                js: $('.ai__function').val(),
                name: $('.ai__name').val(),
                pass: $('.ai__pass').val()
            }
        });
    });

    window.editor.on('change', function(e) {
        var code = window.editor.getSession().getValue(); // Весь текст
        game.replaceAI('you', code);
    });
});