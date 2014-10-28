var EventEmitter = require( 'events' ).EventEmitter;
var util = require( './utilities' );
var Pipeline = require( './pipeline' );
var TaskManager = require( './task-manager' );
var ConfigManager = require( './config-manager' );
var di = require( 'di' );

// PipelineManager constructor.
function PipelineManager ( /* TaskManager */ taskMgr, /* ConfigManager */ configMgr ) {
  PipelineManager.super_.call( this );

  this._taskManager = taskMgr;
  this._configManager = configMgr;
  this._pipelines = {};
}
util.extend( PipelineManager, EventEmitter );
di.annotate( PipelineManager, new di.Inject( TaskManager ) );
di.annotate( PipelineManager, new di.Inject( ConfigManager ) );

// Add a new pipeline or an existing one.
PipelineManager.prototype.add = function ( pipeline, options ) {
  var pipelineToReturn;

  // NOTE(jdm): For some reason, Istanbul does not detect the test for the else case, though the
  // test itself and a `console.log` demonstrate it is, in fact, tested. So I'm telling Istanbul to
  // ignore that branch.
  /* istanbul ignore else  */
  if ( util.types.isString( pipeline ) ) {
    pipelineToReturn = this._pipelines[ pipeline ] = new Pipeline( pipeline, options );
  } else if ( pipeline instanceof Pipeline ) {
    pipelineToReturn = this._pipelines[ pipeline.name() ] = pipeline;
  } else {
    throw new Error( "You must pass an instance of Pipeline or a string name to PipelineManager::add." );
  }

  return pipelineToReturn;
};

// Create Pipelines from what's in the config.
PipelineManager.prototype.createFromConfig = function () {
  var pipelineManager = this;
  var pipelines = this._configManager.get( 'pipelines' );
  var conf;

  if ( ! util.types.isObject( pipelines ) ) {
    return;
  }

  Object.keys( pipelines ).forEach( function ( name ) {
    conf = pipelines[ name ];

    if ( util.types.isArray( conf.files ) || util.types.isString( conf.files ) ) {
      conf.source = util.stream.fromFs( conf.files );
      delete conf.files;
    }

    if ( util.types.isString( conf.dest ) ) {
      conf.dest = util.stream.toFs( conf.dest );
    }

    pipelineManager.add( name, conf );
  });
};

// Fetch an existing pipeline.
PipelineManager.prototype.get = function ( name ) {
  if ( name && util.types.isString( name ) ) {
    return this._pipelines[ name ];
  }
};

// Create a list of tasks with dependencies.
PipelineManager.prototype.tasks = function () {
  var pipeline;
  var depends;
  var pipelineManager = this;
  var tasks = [];
  var deps = {};
  var phase = this._configManager.get( '$phase' );

  function addDep ( hasDep, onDep ) {
    if ( ! deps[ hasDep ] ) {
      deps[ hasDep ] = [];
    }

    deps[ hasDep ].push( onDep );
  }

  // So we can handle join dependencies correctly, we first loop through the pipelines and store the
  // dependencies in the reverse to how they are defined. That is, if `A` says it needs to join to
  // `B`, then we need to tell `B` that it depends on `A` finishing first.
  Object.keys( this._pipelines ).forEach( function ( name ) {
    pipeline = pipelineManager.get( name );

    var join = pipeline.join();
    if ( join ) {
      addDep( join.target, pipeline.taskName() );
    }
  });

  // For each of the pipelines, create its associated task.
  Object.keys( this._pipelines ).forEach( function ( name ) {
    var pipeline = pipelineManager.get( name );
    depends = pipeline.depends();

    // If we discovered one or more dependencies this pipeline has (e.g. from a join), let's add
    // them to the dependencies it already knows about.
    if ( deps[ name ] ) {
      depends = depends.concat( deps[ name ] );
    }

    // Add the task!
    tasks.push({
      name: pipeline.taskName(),
      depends: depends,
      fn: function () {
        // FIXME(jdm): This is ugly. Even though the `pipeline.run` method returns a stream, I had
        // to create this convoluted new stream generator to get everything to work correctly
        // whether or not the returned stream was consumed.
        return util.stream( function ( push, next ) {
          // When the pipeline is done...
          pipeline.on( 'end', function ( res ) {
            var join, concat, joinName;

            // Determine if we need to join this with another pipeline.
            join = pipeline.join();
            if ( join ) {
              joinWith = pipelineManager.get( join.target );

              // Push an error to the stream if an unknown target was specified.
              if ( ! joinWith ) {
                push( new Error( 'Invalid join stream: ' + join.target ) );
              // Otherwise, create a new `concat` curried function from this pipeline's results and
              // add them as a stream to the pipeline at the specified point.
              } else {
                joinName = '$$join-' + name;
                concat = util.stream.concat( util.stream( res ) );

                if ( join.prepend ) {
                  joinWith.prepend( joinName, concat );
                } else if ( join.before ) {
                  joinWith.before( join.before, joinName, concat );
                } else if ( join.after ) {
                  joinWith.after( join.after, joinName, concat );
                } else if ( join.append ) {
                  joinWith.append( joinName, concat );
                } else {
                  // If one of those four join points was not specified, push an error onto the
                  // stream.
                  push( new Error( 'No join point specified' ) );
                }
              }
            }

            // Either way, push the results onto the stream and be done with it.
            push( null, res );
            push( null, util.stream.nil );
            next();
          })

          // On error, push the error on to the stream.
          .on( 'error', function ( err ) {
            push( err );
          });

          // Now that we have our event handlers defined, run the pipeline!
          pipeline.run( phase );
        });

      }
    });
  });

  // Return the array of task objects. We're done.
  return tasks;
};

module.exports = PipelineManager;

