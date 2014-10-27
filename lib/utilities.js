var inherits = require( 'util' ).inherits;
var deepmerge = require( 'warlock-deepmerge' );
var highland = require( 'highland' );
var vinylFs = require( 'vinyl-fs' );
var template = require( 'lodash.template' );

// TYpes
var types = {};

[ 'Function', 'String', 'Number', 'Date', 'RegExp' ].forEach( function( name ) {
  types['is' + name] = function( obj ) {
    return toString.call( obj ) == '[object ' + name + ']';
  };
});

types.isObject = function ( obj ) {
  return obj instanceof Object;
};

types.isArray = function ( obj ) {
  return Array.isArray( obj );
};

types.isStream = function ( obj ) {
  return highland.isStream( obj ) || ( types.isObject( obj ) && types.isFunction( obj.pipe ) );
};

// Objects
var object = {};

object.merge = deepmerge;

// Retrieve the value of a property as represented by its string paths (e.g. `params.id`). Based on
// [this Stack Overflow answer](http://stackoverflow.com/a/6491621/259038).
object.get = function getPropertyByPath ( obj, path ) {
  if ( ! types.isObject( obj ) || ! types.isString( path ) ) {
    return;
  }

  var key;
  var keys = path
    .replace( /\[(\w+)\]/g, '.$1' )
    .replace( /^\./, '' )
    .split( '.' );

  while ( keys.length ) {
    key = keys.shift();
    if ( key in obj ) {
      obj = obj[ key ];
    } else {
      return;
    }
  }

  return obj;
};

object.set = function setPropertyByPath ( obj, prop, value ) {
  var e;

  if ( types.isString( prop ) ) {
    prop = prop.split( '.' );
  }

  if ( prop.length > 1 ) {
    e = prop.shift();
    obj[ e ] = types.isObject( obj[e] ) ? obj[ e ] : {};
    object.set( obj[ e ], prop, value );
  } else {
    obj[ prop[ 0 ] ] = value;
  }
};

// Shamelessly lifted from Grunt.
// https://github.com/gruntjs/grunt-legacy-util/blob/master/index.js
// FIXME(jdm): Since this was copied from Grunt, it is assumed to work, so only a primitive unit
// test is included. Becaue this code is imported and we are now relying on it, I am not telling
// Istanbul to ignore it. This should be tested more.
object.recurse = function ( value, fn, fnContinue ) {
  function recurse ( value, fn, fnContinue, state ) {
    var error;
    if ( state.objs.indexOf( value ) !== -1 ) {
      error = new Error( 'Circular reference detected ( ' + state.path + ' )' );
      error.path = state.path;
      throw error;
    }
    var obj, key;
    if ( fnContinue && fnContinue( value ) === false ) {
      // Skip value if necessary.
      return value;
    } else if ( types.isArray( value ) ) {
      // If value is an array, recurse.
      return value.map( function( item, index ) {
        return recurse( item, fn, fnContinue, {
          objs: state.objs.concat( [value] ),
          path: state.path + '[' + index + ']',
        } );
      } );
    } else if ( types.isObject( value ) && !Buffer.isBuffer( value ) ) {
      // If value is an object, recurse.
      obj = {};
      for ( key in value ) {
        obj[key] = recurse( value[key], fn, fnContinue, {
          objs: state.objs.concat( [value] ),
          path: state.path + ( /\W/.test( key ) ? '["' + key + '"]' : '.' + key ),
        } );
      }
      return obj;
    } else {
      // Otherwise pass value into fn and return.
      return fn( value );
    }
  }
  return recurse( value, fn, fnContinue, {objs: [], path: ''} );
};

// Streams
var stream = highland;

// We wrap this in a highland stream because it's only a read stream and will work just fine.
stream.fromFs = function ( globs, options ) {
  return highland( vinylFs.src( globs, options ) );
};

// Unfortunately, we can't wrap this in a highland stream because it's a duplex stream and it would
// convert it to a read stream, defeating the purpose.
stream.toFs = vinylFs.dest;

stream.reject = function ( err ) {
  return highland( function ( push, next ) {
    push( err );
    push( null, highland.nil );
    next();
  });
};

stream.fromJson = function ( json ) {
  return highland( function ( push, next ) {
    var obj;

    try {
      obj = JSON.parse( json );
      push( null, obj );
    } catch ( err ) {
      push( err );
    } finally {
      push( null, highland.nil );
      next();
    }
  });
};

// Exported libs
module.exports = {
  object: object,
  extend: inherits,
  stream: stream,
  types: types,
  template: template
};
