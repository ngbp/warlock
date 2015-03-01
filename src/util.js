var utilities = {};

[ 'Function', 'String', 'Number', 'Date', 'RegExp' ].forEach( function( name ) { 
  utilities['is' + name] = function ( obj ) {
    return Object.prototype.toString.call( obj ) == '[object ' + name + ']';
  }; 
});

export default utilities;

