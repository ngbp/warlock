var EventEmitter = require( 'events' ).EventEmitter;
var util = require( './utilities' );

// Create a new pipeline.
function Pipeline ( name, options ) {
  Pipeline.super_.call( this );

  var defaultOptions = {};

  this._name = name;
  this._options = util.object.merge( defaultOptions, options || {} );

  // This houses the references to the actual streams of this pipeline, indexed by their name.
  this._streams = {};

  // The stream index tracks the *order* in which the streams will run.
  this._streamIndex = [];
}
util.extend( Pipeline, EventEmitter );

// Get the name of this pipeline.
Pipeline.prototype.name = function () {
  return this._name;
};

// Get the task name of this pipeline, used to reference it in the TaskManager.
Pipeline.prototype.taskName = function () {
  return '$$' + this.name();
};

Pipeline.prototype.join = function () {
  return this._options.join;
};

Pipeline.prototype.depends = function () {
  var depends = this._options.depends;

  // Use an empty array if one wasn't provided.
  if ( ! util.types.isArray( depends ) ) {
    depends = [];
  }
  
  // Return a copy of the array.
  return depends.map( function ( dep ) { return dep; });
};

// An internal method for adding a stream step.
Pipeline.prototype._add = function ( name, stream, options ) {
  // TODO(jdm): Validate args

  this._streams[ name ] = {
    name: name,
    options: options || {},
    dep: [],

    // In the future, we'll support allowing passing in generator functions so that runtime config
    // values can be used to configure streams (e.g. calling a Gulp plugin). In the meantime, we
    // just wrap this so we don't have to change the API too much later.
    generator: function () {
      return stream;
    }
  };

  return this._streams[ name ];
};

// Add a step to the end of the pipeline.
Pipeline.prototype.append = function ( name, stream, options ) {
  this._add( name, stream, options );
  this._streamIndex.push( name );
  return this;
};

// Add a step to the beginning of the pipeline.
Pipeline.prototype.prepend = function ( name, stream, options ) {
  this._add( name, stream, options );
  this._streamIndex.unshift( name );
  return this;
};

// Add a step directly after another step in the pipeline.
Pipeline.prototype.after = function ( dep, name, stream, options ) {
  this._add( name, stream, options );
  this._streams[ name ].dep.push( dep );
  this._streamIndex.splice( this._streamIndex.indexOf( dep ) + 1, 0, name );
  return this;
};

// Add a step directly preceding another step in the pipeline.
Pipeline.prototype.before = function ( dep, name, stream, options ) {
  this._add( name, stream, options );
  this._streams[ dep ].dep.push( name );
  this._streamIndex.splice( this._streamIndex.indexOf( dep ), 0, name );
  return this;
};

// An internal method for converting the ordered index of steps into a stream pipeline.
Pipeline.prototype._pipeline = function ( phase ) {
  var pipeline = this;
  var currentStream;
  var phaseRestrictions = this._options.phases;
  var ignoreStreams = [];

  if ( util.types.isString( phase ) && util.types.isObject( phaseRestrictions ) ) {
    Object.keys( phaseRestrictions ).forEach( function ( p ) {
      if ( p !== phase && util.types.isArray( phaseRestrictions[ p ] ) ) {
        ignoreStreams = ignoreStreams.concat( phaseRestrictions[ p ] );
      }
    });
  }

  if ( ! util.types.isStream( this._options.source ) ) {
    return util.stream.reject( new Error( 'Pipeline has no source.' ) );
  }

  function createErrorHandler ( errStream, prevStream ) {
    return function streamErrorHandler ( err ) {
      // We have to stop the previous stream from throwing anything else this way, if there is a
      // previous stream (otherwise it's this is the first stream and it stopped itself). If we
      // don't stop the previous stream, it will keep throwing data down the pipeline to this
      // stream, which will probably just error out again.
      if ( prevStream ) {
        prevStream.end();
      }

      // And of course we need to indicate error.
      pipeline.emit( 'error', err );
    };
  }

  function addStream ( stream ) {
    var prevStream = currentStream;

    if ( ! currentStream ) {
      if ( util.stream.isStream( stream ) ) {
        currentStream = stream
          .stopOnError( createErrorHandler( stream, prevStream ) );
      } else {
        stream.on( 'error', createErrorHandler( stream, prevStream ) );
        currentStream = stream;
      }
    } else {
      // if it's a highland partially applied fn...
      if ( util.types.isFunction( stream ) ) {
        currentStream = stream( currentStream )
          .stopOnError( createErrorHandler( stream, prevStream ) );
      // else it's assumed to be a node stream...
      } else {
        stream.on( 'error', createErrorHandler( stream, prevStream ) );
        currentStream = currentStream.pipe( stream );
      }
    }
  }

  // add the source
  addStream( this._options.source );

  // Add each stream in the pipeline, in the order in which they've previously been calculated.
  this._streamIndex
    // First, filter out any streams we should ignore.
    .filter( function ( name ) {
      if ( ignoreStreams.indexOf( name ) !== -1 ) {
        return false;
      } else {
        return true;
      }
    })

    // Then translate the stream names to pipelines.
    .map( function forEachStream ( name ) {
      return pipeline._streams[ name ];
    })

    // And finally, add the streams to the running pipeline.
    .forEach( function forEachStream ( stream ) {
      addStream( stream.generator() );
    });

  // If there is a destination, fire that too.
  if ( util.types.isStream( this._options.dest ) || util.types.isFunction( this._options.dest ) ) {
    addStream( this._options.dest );
  }

  return currentStream;
};

// Kick off the pipeline.
Pipeline.prototype.run = function ( phase ) {
  var pipeline = this;

  // Inform any subscribers that this pipeline has started.
  pipeline.emit( 'start' );

  // Create the pipeline of streams, again checking for any errors. Finally, gather everything up
  // and pass it on to subscribers of the `end` event.
  util.stream( this._pipeline( phase ) )
    .stopOnError( function ( err ) {
      pipeline.emit( 'error', err );
    })
    .toArray( function ( res ) {
      pipeline.emit( 'end', res );
    });
};

module.exports = Pipeline;

