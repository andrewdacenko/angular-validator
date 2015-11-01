var pkg = require('./package.json');
var gulp = require('gulp');
var wrap = require('gulp-wrap');
var rimraf = require('rimraf');
var gulpIf = require('gulp-if');
var concat = require('gulp-concat');
var header = require('gulp-header');
var uglify = require('gulp-uglify');
var plumber = require('gulp-plumber');
var ngAnnotate = require('gulp-ng-annotate');
var sourcemaps = require('gulp-sourcemaps');

var banner = [
    '/**',
    ' * <%= pkg.description %>',
    ' * @version v<%= pkg.version %>',
    ' * @link <%= pkg.homepage %>',
    ' * @license <%= pkg.license %>',
    ' */\n'
].join('\n');

var module = {
    header: 'angular.module(\'ngValidator\', [\'ngValidator.message-bag\', \'ngValidator.validation-translator\', \'ngValidator.validator\']);\n\n',
    wrap: ';(function (window, angular, undefined) {\n\'use strict\';\n<%= contents %>\n})(window, angular);'
};

var scripts = ['src/**/*.module.js', 'src/**/!(*.spec).js'];

gulp.task('clean', function(cb) {
    rimraf('dist', cb);
});

gulp.task('copy-bower', function() {
    return gulp.src('bower.json')
        .pipe(gulp.dest('dist'));
});

gulp.task('scripts', ['clean'], buildScripts);

gulp.task('uglify', ['clean'], buildScripts.bind(null, true));

function buildScripts() {
    var minify = (arguments.length === 2);

    return gulp.src(scripts)
        .pipe(plumber())
        .pipe(gulpIf(minify, sourcemaps.init()))
        .pipe(concat(pkg.name + (minify ? '.min' : '') + '.js'))
        .pipe(header(module.header))
        .pipe(wrap(module.wrap))
        .pipe(gulpIf(minify, ngAnnotate()))
        .pipe(gulpIf(minify, uglify()))
        .pipe(header(banner, {
            pkg: pkg
        }))
        .pipe(gulpIf(minify, sourcemaps.write('./')))
        .pipe(gulp.dest('dist'));
}

gulp.task('test', runKarma.bind(null, true));

gulp.task('tdd', runKarma);

function runKarma(done) {
    var singleRun = false;

    if(arguments.length === 2) {
        done = arguments[1];
        singleRun = true;
    }

    var Server = require('karma').Server;
    var server = new Server({
        configFile: __dirname + '/karma.conf.js',
        singleRun: singleRun
    }, function() {
        done();
    });

    server.start();
}

gulp.task('build', ['scripts', 'uglify', 'copy-bower']);

gulp.task('default', ['build']);
