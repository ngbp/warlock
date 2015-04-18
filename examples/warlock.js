var warlock = require( 'warlock' );
var browserSpell = require( 'warlock-browser-spell' );

// Perhaps we should allow a "default" spell to accommodate a cleaner syntax: source::javascripts
// warlock.pipeline( 'browser::source::javascript' )
browserSpell.tree( 'source' ).pipeline( 'javascript' )
  .options( 'filter', [ '!**/*.spec.js' ] )
  .after( 'jshint', ( stream ) => {
    return stream.pipe( coffee() )
  })
  .before( 'uglify', new ngAnnotateTask() )
  ;

