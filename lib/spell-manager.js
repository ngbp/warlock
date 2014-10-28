var EventEmitter = require( 'events' ).EventEmitter;
var path = require( 'path' );
var fs = require( 'fs' );
var ConfigManager = require( './config-manager' );
var PipelineManager = require( './pipeline-manager' );
var util = require( './utilities' );
var di = require( 'di' );

function SpellManager ( /* ConfigManager */ configMgr, /* PipelineManager */ pipelineMgr ) {
  SpellManager.super_.call( this );

  this._configManager = configMgr;
  this._pipelineManager = pipelineMgr;

  // Create a place to store spell functions to run later.
  this._spellFns = [];

  // Store the location of modules for later use.
  this._modulePath = path.resolve( 'node_modules' );
}
util.extend( SpellManager, EventEmitter );
di.annotate( SpellManager, new di.Inject( ConfigManager ) );
di.annotate( SpellManager, new di.Inject( PipelineManager ) );

// A convenience check to ensure an object loaded from a package.json file represents a warlock
// spell.
SpellManager.prototype._isSpell = function ( config ) {
  if ( util.types.isArray( config.keywords ) && config.keywords.indexOf( 'warlockspell' ) !== -1 ) {
    return true;
  } else {
    return false;
  }
};

// A convenience check to ensure a spell is not disabled in the runtime config.
SpellManager.prototype._isSpellDisabled = function ( config ) {
  var disabled = this._configManager.get( 'disabled.spells' );

  if ( util.types.isArray( disabled ) && disabled.indexOf( config.name ) !== -1 ) {
    return true;
  } else {
    return false;
  }
};

// A no-side-effects through stream generator that loads the configuration behind a `warlock` key
// into the runtime configuration.
SpellManager.prototype._loadConfigFromPackageFile = function () {
  var spellManager = this;

  return util.stream.doto( function ( config ) {
    if ( util.types.isObject( config.warlock ) ) {
      spellManager._configManager.merge( config.warlock );
    }
  });
};

// A stream generator that takes an object from a package.json and loads its spells.
SpellManager.prototype._loadSpellsFromPackageFile = function () {
  var spellManager = this;

  return util.stream.flatMap( function ( config ) {
    var dir = path.join( spellManager._modulePath, config.name, 'spells' );
    return spellManager.loadFromPath( dir );
  });
};

// Load all JS files from the specified directory and if there export is a function, store it for
// later use; we don't run it yet.
SpellManager.prototype.loadFromPath = function ( dir ) {
  var spellManager = this;
  var glob = path.join( dir, '**', '*.js' );

  return util.stream.fromFs( glob )

    // We really just used this to get existing files before requiring them, so let's require them.
    .map( function ( file ) {
      return require( file.path );
    })

    // Obviously, we care only for Functions.
    .filter( function ( fn ) {
      return util.types.isFunction( fn );
    })

    // Now we only have functions, so we can store them for later use.
    .doto( function ( fn ) {
      spellManager._spellFns.push( fn );
    })

    // We only want to return the count.
    .collect()
    .map( function ( res ) {
      // If there were no spells at this path, emit a warning.
      if ( res.length === 0 ) {
        spellManager.emit( 'warn', 'Could not load spells from: ' + dir );
      }

      return res;
    });
};

// Load all spells from NPM, merging in their configurations now, but storing their functions for
// later use.
SpellManager.prototype.loadNpmSpells = function () {
  var spellManager = this;
  var pkgFileGlob = path.join( this._modulePath, '*', 'package.json' );

  this.emit( 'start_npm' );

  // Read in all package files as a stream.
  return util.stream.fromFs( pkgFileGlob )

    // We only care about the contents of the file.
    .map( function ( file ) {
      return file.contents.toString();
    })

    // Parse the JSON.
    .flatMap( util.stream.fromJson )

    // Filter out any non-spell modules.
    .filter( function ( x ) {
      return spellManager._isSpell( x );
    })

    // Filter out any disabled spells.
    .reject( function ( x ) {
      return spellManager._isSpellDisabled( x );
    })

    // And then load the config.
    .through( this._loadConfigFromPackageFile() )

    // And process the spell files.
    .through( this._loadSpellsFromPackageFile() )

    // It's always possible that something horrible went wrong, so let's catch the error.
    .stopOnError( function ( err ) {
      spellManager.emit( 'error', err );
    })

    // We only want to return the number of spells processed.
    .collect()
    .map( function ( res ) {
      spellManager.emit( 'end_npm', res.length );
      return res.length;
    });
};

// Run all the defined spell functions.
SpellManager.prototype.runSpells = function () {
  var api = {
    config: this._configManager,
    pipelines: this._pipelineManager,
    util: util
  };

  this._spellFns.forEach( function ( spell ) {
    spell( api );
  });
};

module.exports = SpellManager;

