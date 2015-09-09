var _ = require('underscore');
var babelify = require('babelify');
var browserify = require('browserify');
var buffer = require('vinyl-buffer');
var gulp = require('gulp');
var gutil = require('gulp-util');
var rename = require('gulp-rename');
var source = require('vinyl-source-stream');
var sourcemaps = require('gulp-sourcemaps');
var sass = require('gulp-sass');
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

gulp.task('style', function() {
    return gulp.src('./src/sass/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(rename({extname: '.css'}))
        .pipe(gulp.dest('./public/assets/css'));
});

gulp.task('watch-style', function() {
    return gulp.watch('./src/sass/*.scss', ['style']);
});

gulp.task('js', function() {
    return bundle_js(browserify('./src/js/index.js', {debug: true}).transform(babelify, {}));
});

gulp.task('watch-js', function() {
    var args = _.defaults(watchify.args, { debug: true });
    var bundler = watchify(browserify('./src/js/index.js', args)).transform(babelify, {});
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
    return bundle_js(bundler);
});

gulp.task('watch', ['watch-style', 'watch-js']);
gulp.task('default', ['style', 'js']);
