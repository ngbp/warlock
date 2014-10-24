var deepmerge = require( 'warlock-deepmerge' );
var util = require( './utilities' );

function ConfigManager () {
  this._config = {};
}

ConfigManager.prototype.get = function ( key ) {
  return this._process( this.getRaw( key ) );
};

ConfigManager.prototype.getRaw = function ( key ) {
  return util.object.get( this._config, key );
};

ConfigManager.prototype.set = function ( key, value, nomerge ) {
  var newVal;
  var oldVal = this.getRaw( key );
  var shouldMerge = nomerge ? false : true;

  if ( ! util.types.isObject( value ) || ! util.types.isObject( oldVal ) || ! shouldMerge ) {
    util.object.set( this._config, key, value );
    newVal = this.getRaw( key );
  } else {
    newVal = util.object.merge( oldVal, value );
    util.object.set( this._config, key, newVal );
  }

  return newVal;
};

ConfigManager.prototype._process = function ( raw ) {
  var cfgmgr = this;
  var config = this._config;

  // This will call the given function for every non-object, non-array property of the given object,
  // however deep it has to go to do it.
  return util.object.recurse( raw, function ( value ) {
    if ( value === undefined ) {
      return value;
    }

    // We cannot process a non-string value (e.g. a number or a stream or whatnot) as a template, so
    // just return it.
    if ( ! util.types.isString( value ) ) {
      return value;
    }

    // If possible, access the specified property via config.get, in case it doesn't refer to a
    // string, but instead refers to an object or array.
    var matches = value.match( /^<%=\s*([a-z0-9_$]+(?:\.[a-z0-9_$]+)*)\s*%>$/i );
    if ( matches ) {
      result = cfgmgr.get( matches[ 1 ] );

      // If the result retrieved from the config data wasn't null or undefined, return it.
      if ( result != null ) {
        return result;
      }
    }

    // Process the string as a template.
    return util.template( value, config );
  });
};

module.exports = ConfigManager;

