var pkg = require('./package.json');
var gulp = require('gulp');
var del = require('del');
var wrap = require('gulp-wrap');
var concat = require('gulp-concat');
var header = require('gulp-header');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');

var banner = [
    '/**',
    ' * <%= pkg.description %>',
    ' * @version v<%= pkg.version %>',
    ' * @link <%= pkg.homepage %>',
    ' * @license <%= pkg.license %>',
    ' */\n'
].join('\n');

gulp.task('clean', function (cb) {
    del(['dist/*.js'], cb);
});

gulp.task('scripts', ['clean'], function () {
    return gulp.src(['src/**/*.js', '!src/**/test/*.spec.js'])
        .pipe(concat(pkg.name + '.js'))
        .pipe(header('angular.module(\'ngValidator\', [\'ngValidator.message-bag\', \'ngValidator.validation-translator\', \'ngValidator.validator\']);\n\n'))
        .pipe(wrap(';(function (window, angular, undefined) {\n"use strict";\n<%= contents %>\n})(window, angular);'))
        .pipe(header(banner, {
            pkg: pkg
        }))
        .pipe(gulp.dest('dist'));
});

gulp.task('uglify', ['clean'], function () {
    return gulp.src(['src/**/*.js', '!src/**/test/*.spec.js'])
        .pipe(sourcemaps.init())
        .pipe(concat(pkg.name + '.min.js'))
        .pipe(header('angular.module(\'ngValidator\', [\'ngValidator.message-bag\', \'ngValidator.validation-translator\', \'ngValidator.validator\']);\n\n'))
        .pipe(wrap(';(function (window, angular, undefined) {\n"use strict";\n<%= contents %>\n})(window, angular);'))
        .pipe(uglify())
        .pipe(header(banner, {
            pkg: pkg
        }))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('dist'));
});

gulp.task('test', function (done) {
    require('karma').server.start({
        configFile: __dirname + '/karma.conf.js',
        singleRun: true
    }, function () {
        done();
    });
});

gulp.task('tdd', function (done) {
    require('karma').server.start({
        configFile: __dirname + '/karma.conf.js',
    }, function () {
        done();
    });
});

gulp.task('build', ['scripts', 'uglify']);

gulp.task('default', ['build']);
