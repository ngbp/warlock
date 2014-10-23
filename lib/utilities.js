var inherits = require( 'util' ).inherits;
var deepmerge = require( 'warlock-deepmerge' );
var highland = require( 'highland' );
var vinylFs = require( 'vinyl-fs' );
var nodeStreams = require( 'stream' );

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
}

types.isStream = function ( obj ) {
  return highland.isStream( obj ) || ( types.isObject( obj ) && types.isFunction( obj.pipe ) );
}

// Objects
var object = {};

object.merge = deepmerge;

// Streams
var stream = highland;

stream.fromFs = vinylFs.src;
stream.toFs = vinylFs.dest;

stream.reject = function ( err ) {
  return highland( function ( push, next ) {
    push( err );
    push( null, highland.nil );
    next();
  });
};

// Exported libs
module.exports = {
  object: object,
  extend: inherits,
  stream: stream,
  types: types
};

