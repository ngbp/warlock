// Well, it's pretty stupid to have a Gulpfile, but Warlock doesn't exist yet!
// FIXME(jdm): Migrate to Warlock.

var gulp = require( 'gulp' );
var istanbul = require( 'gulp-istanbul' );
var mocha = require( 'gulp-mocha' );

gulp.task( 'test', function ( cb ) {
  gulp.src([ 'lib/**/*.js', '!lib/**/*.spec.js' ])
    .pipe( istanbul() )
    .on( 'finish', function () {
      gulp.src([ 'lib/**/*.spec.js' ])
        .pipe( mocha({ reporter: 'spec', slow: 50 }) )
        .pipe( istanbul.writeReports({ reporters: [ 'html', 'text-summary', 'text' ] }) )
        .on( 'end', cb );
    });
});

