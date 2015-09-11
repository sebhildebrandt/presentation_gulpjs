'use strict';
// ==============================================================================
// gulpfile.js
// ==============================================================================
// Boilerplate gulpfile for smaller projects
// automating frontend & (in future versions) backend tasks
// 
// Version 0.1.1 - expect huge changes ...
// 
// (c) 2015 Sebastian Hildebrandt, +innovations 
// License: MIT
// ------------------------------------------------------------------------------
// Expected files / structure
// 
// 	gulpfile.js 									// this file ...
// 	gulp/config/development.json 					// default configuration file
// 	gulp/config/... .json							// ... place other config files also in the gulp/config directory
// 	gulp/... .js 									// if you split up yor gulpfile into smaller chunks, place them here ...
//
// ==============================================================================
// 1. DEPENDENCIES
// ==============================================================================

var gulp = require('gulp');                 		// gulp core

// gulp-plugins
var plugins = require('gulp-load-plugins')({
  pattern: ['gulp-*', 'gulp.*'], 					// the glob(s) to search for
  scope: ['devDependencies'],
  replaceString: /^gulp(-|\.)/, 					// what to remove from the name of the module when adding it to the context
  camelize: true, 									// if true, transforms hyphenated plugins names to camel case
  lazy: true, 										// whether the plugins should be lazy loaded on demand
});

// other plugins 
var browserify = require('browserify');
var source = require('vinyl-source-stream'); 
var browserSync = require('browser-sync'); 
var express = require('express');
var runSequence = require('run-sequence');
var eventStream = require('event-stream');

//
var cachebust = new plugins.cachebust();
var server;


// ==============================================================================
// 2. CONFIG 
// ==============================================================================
 
var buildEnv = plugins.util.env.environment || 'development'; 	// > gulp --environment production
var config = require('./gulp/config/'+buildEnv+'.json');

// ==============================================================================
// 3. FILE SOURCES/DESTINATIONS (RELATIVE)
// ==============================================================================
 
var target = {

	dist : 'dist',
	// HTML
	html_src : 'src/**/*.html',
	html_dist : 'dist',

	// IMAGES
	img_src : [
		'src/img/**/*.png',
		'src/img/**/*.jpg',
	],
	img_dist : 'dist/img',

	// CSS
	css_src : 'src/vendor/**/*.css',

	// SASS
	scss_src : 'src/scss/**/*.scss',
	styles_dist : 'dist/css',

	// JS
	js_src : 'src/js/**/*.js',
	js_dist : 'dist/js'

	// TEST

};

// ==============================================================================
// 4. FRONT-END TASKS
// ==============================================================================

// -----------------------------------------------------------------
// 4.1. STYLES
// -----------------------------------------------------------------

gulp.task('styles', function() {
	var vendorFiles = gulp.src(target.css_src);
	var appFiles = gulp.src(target.scss_src)
		.pipe(buildEnv === 'production' ? plugins.util.noop() : plugins.sourcemaps.init())
		.pipe(plugins.sass({
			sourceComments: buildEnv === 'development' ? 'map' : false
		})).on('error', handleError)
		.pipe(cachebust.references())
		.pipe(plugins.autoprefixer('last 2 version'))
		.pipe(buildEnv === 'production' ? plugins.util.noop() : plugins.sourcemaps.write());

	return eventStream.concat(vendorFiles, appFiles)
		//.pipe(buildEnv === 'production' ? plugins.uncss({ html : 'dist/index.html' }) : plugins.util.noop())
		//.pipe(buildEnv === 'production' ? plugins.csso() : plugins.util.noop())
		.pipe(config.minify ? plugins.minifyCss() : plugins.util.noop())
		.pipe(gulp.dest('dist/css'))
		.pipe(reload());
});


// -----------------------------------------------------------------
// 4.2. SCRIPTS
// -----------------------------------------------------------------

gulp.task('scripts', function() {
return gulp.src(target.js_src)
      .pipe(config.minify ? plugins.buffer() : plugins.util.noop())
      .pipe(config.minify ? plugins.uglify() : plugins.util.noop())
      .pipe(gulp.dest(target.js_dist))
      .pipe(reload());
});

// -----------------------------------------------------------------
// 4.3. VENDOR FILES / ASSETS
// -----------------------------------------------------------------

// copy to dest/build
// concatiate

// -----------------------------------------------------------------
// 4.4. IMAGES
// -----------------------------------------------------------------

gulp.task('images', function() {
	return gulp.src(target.img_src)
		.pipe(config.minify ? plugins.imagemin() : plugins.util.noop())
		.pipe(cachebust.resources())
		.pipe(gulp.dest(target.img_dist))
		.pipe(reload());
});

// -----------------------------------------------------------------
// 4.5. HTML
// -----------------------------------------------------------------

gulp.task('html', function() {
	return gulp.src(target.html_src)
		.pipe(cachebust.references())
		.pipe(gulp.dest(target.html_dist))
		.pipe(reload());
});


// -----------------------------------------------------------------
// 4.6. WATCH
// -----------------------------------------------------------------

gulp.task('watch', function() { 
  gulp.watch(target.img_src, ['prebuild']); 
  gulp.watch(target.html_src, ['prebuild']); 
  gulp.watch(target.scss_src, ['prebuild']); 
  gulp.watch(target.js_src, ['scripts']);
});


// -----------------------------------------------------------------
// 5. OTHER TASKS (incl. DEFAULT)
// -----------------------------------------------------------------

// helper task, to show config (not needed in production)
gulp.task('showconfig', function() {
	return plugins.util.log(config)
});

// images need to be run before html (cachbust)
gulp.task('prebuild', function(done) {
    runSequence('images', ['html', 'styles'], done); 
});

// for final build, prebuild is a prerequisite
gulp.task('build', ['prebuild', 'scripts']);


gulp.task('default', ['build', 'watch', 'server']);


// -----------------------------------------------------------------
// 6. ADDITIONAL FUNCTIONS
// -----------------------------------------------------------------

gulp.task('server', function() { 
	if (config.server || config.server.port) {
		server = express(); 
		server.use(express.static(target.dist)); 
		server.listen(config.server.port);
	    browserSync({ proxy: config.server.url+':'+config.server.port });
	}
  });

function handleError(err) { 
  console.log(err.toString()); 
  this.emit('end');
}

function reload() { 
  if (server) {
    return browserSync.reload({ stream: true }); 
  }
  return plugins.util.noop(); 
}
