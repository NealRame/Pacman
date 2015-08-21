var _ = require('underscore');
var babelify = require('babelify');
var browserify = require('browserify');
var buffer = require('vinyl-buffer');
var gulp = require('gulp');
var gutil = require('gulp-util');
var source = require('vinyl-source-stream');
var sourcemaps = require('gulp-sourcemaps');
// var uglify = require('gulp-uglify');
var watchify = require('watchify');

function bundle_js(bundler) {
    return bundler.bundle()
        .on('error', (function(err) {
            gutil.log(err.message);
            err.stream.end();
        }).bind())
        .pipe(source('public/assets/scripts/app.js'))
        .pipe(buffer())
        .pipe(gulp.dest('.'))
        .pipe(sourcemaps.init({loadMaps: true}))
            // .pipe(uglify())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('.'));
}

gulp.task('watchify', function () {
    var args = _.defaults(watchify.args, { debug: true });
    var bundler = watchify(browserify('./src/index.js', args)).transform(babelify, {});
    bundle_js(bundler);
    bundler
        .on('update', function (ids) {
            gutil.log('Update:');
            _.each(ids, function(id) {
                gutil.log(' - ' + id);
            });
            bundle_js(bundler);
        })
        .on('log', function (msg) {
            gutil.log(msg);
        });
});

gulp.task('default', function() {
    var bundler = browserify('./src/index.js', {debug: true})
        .transform(babelify, {});
    return bundle_js(bundler);
});
