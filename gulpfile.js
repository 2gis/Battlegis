var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var glob = require('glob').sync;
var _ = require('lodash');
var mocha = require('gulp-mocha');

var paths = {
    battlegis: [['config.js'], 'engine/*.js', 'bots/*.js', 'example/*.js']
};

gulp.task('default', ['build', 'watch']);

function build(engine) {
    var entries = [
        './example/client'
    ];
    if (!engine)
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
        .pipe(source(engine ? 'engine.js' : 'battlegis.js'))
        .pipe(gulp.dest('./build/'));
}

gulp.task('build.engine', _.partial(build, true));
gulp.task('build.client', _.partial(build, false));

gulp.task('build', ['build.engine', 'build.client']);
 
gulp.task('test', function () {
    return gulp.src('./**/*.spec.js', {read: false})
        .pipe(mocha());
});

gulp.task('watch', function() {
    gulp.watch(paths.battlegis, ['build.client']);
});