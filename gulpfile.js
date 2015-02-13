var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var glob = require('glob').sync;
var _ = require('lodash');
var args = require('yargs').argv;

var paths = {
    battlegis: [['config.js'], 'engine/*.js', 'bots/*.js', 'example/*.js']
};

gulp.task('default', ['build', 'watch']);

gulp.task('build', function() {
    var entries = [
        './example/client'
    ];
    if (!args.engine)
        entries.push('./example/map');
    var b = browserify(entries);
    var bots = glob('./bots/*.js');

    bots = _.difference(bots, ['./bots/proto.js']);

    bots.forEach(function(fn) {
        b.require(fn, {
            expose: '.' + fn
        });
    });

    b.require('events');

    return b
        .bundle()
        .pipe(source('battlegis.js'))
        .pipe(gulp.dest('./build/'));
});

gulp.task('watch', function() {
    gulp.watch(paths.battlegis, ['build']);
});