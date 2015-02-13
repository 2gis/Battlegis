var express = require('express');
var bodyParser = require('body-parser'); // Для распарсивания POST-запросов
var app = express();

// var Battlegis = require('./engine');
var config = require('./config');
var battlegis = require('./game');

battlegis.init(config);
var game = battlegis.get();

var users = [];

// var game = new Battlegis(config);
// game.level(6);
// game.run();
// game.stop();

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
})); 

// app.post('/ai', function (req, res) {
//     res.set('Access-Control-Allow-Origin', '*');

//     var name = req.param('name');
//     var pass = req.param('pass');
//     var js = req.param('js');

//     console.log('AI request for ' + name);
//     auth(name, pass).resolve(function() {
//         game.replaceAI(req.param('name'), req.param('js'));
//         console.log('AI replaced');
//     });
    

//     res.json();
// });

// app.get('/api', function (req, res) {
//     res.set('Access-Control-Allow-Origin', '*');

//     var since = req.param('since');

//     var json = game.get({
//         since: since
//     });

//     res.json(json);
// });

app.use('/*', require('./server/auth'));

app.use('/', express.static(__dirname + '/example'));
app.use('/build', express.static(__dirname + '/build'));
app.use('/node_modules', express.static(__dirname + '/node_modules'));


var server = app.listen(config.port || 3009, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Tanks app listening at http://%s:%s', host, port);
});