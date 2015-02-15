// Generated on 2015-02-15 using generator-jhipster 2.2.0
/* jshint camelcase: false */
'use strict';

var gulp = require('gulp'),
    gutil = require('gulp-util'),
    prefix = require('gulp-autoprefixer'),
    minifyCss = require('gulp-minify-css'),
    usemin = require('gulp-usemin'),
    uglify = require('gulp-uglify'),
    minifyHtml = require('gulp-minify-html'),
    imagemin = require('gulp-imagemin'),
    ngAnnotate = require('gulp-ng-annotate'),
    ngConstant = require('gulp-ng-constant-fork'),
    jshint = require('gulp-jshint'),
    rev = require('gulp-rev'),
    connect = require('gulp-connect'),
    proxy = require('proxy-middleware'),
    es = require('event-stream'),
    flatten = require('gulp-flatten'),
    clean = require('gulp-clean'),
    url = require('url'),
    wiredep = require('wiredep').stream,
    fs = require('fs');

var karma = require('gulp-karma')({configFile: 'src/test/javascript/karma.conf.js'});

var yeoman = {
    app: 'src/main/webapp/',
    dist: 'src/main/webapp/dist/',
    test: 'src/test/javascript/spec/',
    tmp: '.tmp/',
    port: 9000,
    apiPort: 8080,
    liveReloadPort: 35729
};

var endsWith = function (str, suffix) {
    return str.indexOf('/', str.length - suffix.length) !== -1;
};


var parseString = require('xml2js').parseString;
var parseVersionFromPomXml = function() {
    var version;
    var pomXml = fs.readFileSync('pom.xml', 'utf8');
    parseString(pomXml, function (err, result) {
        version = result.project.version[0];
    });
    return version;
};

gulp.task('clean', function() {
    return gulp.src(yeoman.dist, {read: false}).
        pipe(clean());
});

gulp.task('clean:tmp', function() {
    return gulp.src(yeoman.tmp, {read: false}).
        pipe(clean());
});

gulp.task('test', ['wiredep:test', 'ngconstant:dev'], function() {
    karma.once();
});

gulp.task('copy', ['clean'], function() {
    return es.merge(gulp.src(yeoman.app + 'i18n/**').
              pipe(gulp.dest(yeoman.dist + 'i18n/')),
              gulp.src(yeoman.app + 'assets/**/*.{woff,svg,ttf,eot}').
              pipe(flatten()).
              pipe(gulp.dest(yeoman.dist + 'assets/fonts/')));
});

gulp.task('images', function() {
    return gulp.src(yeoman.app + 'assets/images/**').
        pipe(imagemin({optimizationLevel: 5})).
        pipe(gulp.dest(yeoman.dist + 'assets/images')).
        pipe(connect.reload());
});

gulp.task('styles', [], function() {
    return gulp.src(yeoman.app + 'assets/styles/**/*.css').
        pipe(gulp.dest(yeoman.tmp)).
        pipe(connect.reload());
});

gulp.task('scripts', function () {
    gulp.src(yeoman.app + 'scripts/**').
        pipe(connect.reload());
});

gulp.task('serve', ['wiredep:test', 'wiredep:app', 'ngconstant:dev'], function() {
    var baseUri = 'http://localhost:' + yeoman.apiPort;
    // Routes to proxy to the backend. Routes ending with a / will setup
    // a redirect so that if accessed without a trailing slash, will
    // redirect. This is required for some endpoints for proxy-middleware
    // to correctly handle them.
    var proxyRoutes = [
        '/api',
        '/health',
        '/configprops',
        '/api-docs',
        '/metrics',
        '/dump',
        '/console/'
    ];

    var requireTrailingSlash = proxyRoutes.filter(function (r) {
        return endsWith(r, '/');
    }).map(function (r) {
        // Strip trailing slash so we can use the route to match requests
        // with non trailing slash
        return r.substr(0, r.length - 1);
    });

    connect.server({
        root: [yeoman.app, yeoman.tmp],
        port: yeoman.port,
        livereload: {
            port: yeoman.liveReloadPort
        },
        middleware: function() {
            return [
                // Ensure trailing slash in routes that require it
                function (req, res, next) {
                    for (var route in requireTrailingSlash) {
                        if (url.parse(req.url).path === route) {
                            res.statusCode = 301;
                            res.setHeader('Location', route + '/');
                            res.end();
                        }
                        next();
                    }
                }
            ].concat(
                // Build a list of proxies for routes: [route1_proxy, route2_proxy, ...]
                proxyRoutes.map(function (r) {
                    var options = url.parse(baseUri + r);
                    options.route = r;
                    return proxy(options);
                }));
        }
    });
    gulp.run('watch');
});

gulp.task('watch', function() {
    gulp.watch('bower.json', ['wiredep:test', 'wiredep:app']);
    gulp.watch(['Gruntfile.js', 'pom.xml'], ['ngconstant:dev']);
    gulp.watch(yeoman.app + '*.html', ['usemin']);
    gulp.watch(yeoman.app + 'scripts/**', ['scripts']);
    gulp.watch(yeoman.app + 'assets/styles/**/*.css', ['styles']);
    gulp.watch('src/images/**', ['images']);
});

gulp.task('wiredep', ['wiredep:test', 'wiredep:app']);

gulp.task('wiredep:app', function () {
    gulp.src('src/main/webapp/index.html')
    .pipe(wiredep({
        exclude: [/angular-i18n/, /swagger-ui/]
    }))
    .pipe(gulp.dest('src/main/webapp'));
});

gulp.task('wiredep:test', function () {
    gulp.src('src/test/javascript/karma.conf.js')
    .pipe(wiredep({
        exclude: [/angular-i18n/, /swagger-ui/, /angular-scenario/],
        ignorePath: /\.\.\/\.\.\//, // remove ../../ from paths of injected javascripts
        devDependencies: true,
        fileTypes: {
            js: {
                block: /(([\s\t]*)\/\/\s*bower:*(\S*))(\n|\r|.)*?(\/\/\s*endbower)/gi,
                detect: {
                    js: /'(.*\.js)'/gi
                },
                replace: {
                    js: '\'{{filePath}}\','
                }
            }
        }
    }))
    .pipe(gulp.dest('src/test/javascript'));
});

gulp.task('build', ['copy', 'wiredep:app', 'ngconstant:prod'], function () {
    gulp.run('usemin');
});

gulp.task('usemin', ['images', 'styles'], function() {
    return gulp.src([yeoman.app + '**/*.html', '!' + yeoman.app + 'bower_components/**/*.html']).
        pipe(usemin({
            css: [
                prefix.apply(),
                minifyCss({root: 'src/main/webapp'}),  // Replace relative paths for static resources with absolute path with root
                'concat', // Needs to be present for minifyCss root option to work
                rev()
            ],
            html: [
                minifyHtml({empty: true, conditionals:true})
            ],
            js: [
                ngAnnotate(),
                uglify(),
                'concat',
                rev()
            ]
        })).
        pipe(gulp.dest(yeoman.dist)).
        pipe(connect.reload());
});

gulp.task('ngconstant:dev', function() {
    ngConstant({
        dest: 'app.constants.js',
        name: 'jhipsterApp',
        deps:   false,
        noFile: true,
        interpolate: /\{%=(.+?)%\}/g,
        wrap: '/* jshint quotmark: false */\n"use strict";\n// DO NOT EDIT THIS FILE, EDIT THE GULP TASK NGCONSTANT SETTINGS INSTEAD WHICH GENERATES THIS FILE\n{%= __ngModule %}',
        constants: {
            ENV: 'dev',
            VERSION: parseVersionFromPomXml()
        }
    })
    .pipe(gulp.dest(yeoman.app + 'scripts/app/'));
});

gulp.task('ngconstant:prod', function() {
    ngConstant({
        dest: 'app.constants.js',
        name: 'jhipsterApp',
        deps:   false,
        noFile: true,
        interpolate: /\{%=(.+?)%\}/g,
        wrap: '/* jshint quotmark: false */\n"use strict";\n// DO NOT EDIT THIS FILE, EDIT THE GULP TASK NGCONSTANT SETTINGS INSTEAD WHICH GENERATES THIS FILE\n{%= __ngModule %}',
        constants: {
            ENV: 'prod',
            VERSION: parseVersionFromPomXml()
        }
    })
    .pipe(gulp.dest(yeoman.tmp + 'scripts/app/'));
});

gulp.task('jshint', function() {
    return gulp.src(['gulpfile.js', yeoman.app + 'scripts/**/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('server', ['serve'], function () {
    gutil.log('The `server` task has been deprecated. Use `gulp serve` to start a server');
});

gulp.task('default', function() {
    gulp.run('test');
    gulp.run('build');
});
