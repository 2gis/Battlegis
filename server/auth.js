module.exports = function(req, res) {
    res.set('Access-Control-Allow-Origin', '*');

    var name = req.param('name');
    var ai = req.param('ai');
    var tempPass = req.cookies.tempPass;

    // Валидация консистентности
    if (!name) {
        res.json({
            status: 'fail'
        });
        return;
    };

    // Аутентификация пользователя
    var user = _.find(users, function(user) {
        return user.name == name;
    });

    function isNewUser() {
        return name && code && 
            (
                !user ||
                (tempPass && (user.tempPass != tempPass) && Date.now() - user.lastVisit > 10 * 60 * 1000)
            ) // Либо пользователя вообще нет, либо пароль не совпадает, а старый отвалился более 10 минут назад -> заменяем
    }

    function authUser() {
        return name && tempPass && user.tempPass == tempPass;
    }

    // Первая попытка пользователя засабмитить код
    if (isNewUser()) {
        tempPass = tempPass || Math.random() * Number.MAX_SAFE_INTEGER;
        res.cookie('tempPass', tempPass, {
            path: '/',
            expires: 367
        });
        users[name] = {
            tempPass: tempPass,
            lastVisit: Date.now(),
            code: code
        };

        // add bot here

    // Второй или более поздний заход пользователя уже с пароль-кукой
    } else if (authUser()) {
        // Пользователь говорит что он наблюдает за битвой, "не удаляйте меня пожалуйста"
        users[name].lastVisit = Date.now();

        if (code) {
            // replace ai here
        }
    }

    var json = {
        status: 'ok'
    };

    res.json(json);
};