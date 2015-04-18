import _ from 'highland'
import stream from 'stream'

var utilities = {};

[ 'Function', 'String', 'Number', 'Date', 'RegExp' ].forEach( function( name ) { 
  utilities['is' + name] = function ( obj ) {
    return Object.prototype.toString.call( obj ) == '[object ' + name + ']';
  }; 
});

utilities.isStream = function ( s ) {
  return _.isStream( s );
};

utilities.isNodeStream = function ( s ) {
  return s instanceof stream.Stream;
};

export default utilities;

