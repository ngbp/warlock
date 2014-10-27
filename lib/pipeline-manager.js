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
  var pipelines = this._pipelines;
  var tasks = [];

  Object.keys( pipelines ).forEach( function ( name ) {
    pipeline = pipelines[ name ];

    tasks.push({
      name: pipeline.taskName(),
      depends: pipeline.depends(),
      fn: function () {
        return util.stream( function ( push, next ) {
          // When the pipeline is done, pass in the stream end value and call next.
          pipeline.on( 'end', function ( res ) {
            push( null, res );
            push( null, util.stream.nil );
            next();
          })

          // On error, push the error on to the stream.
          .on( 'error', function ( err ) {
            push( err );
          });

          pipeline.run();
        });
      }
    });
  });

  return tasks;
};

module.exports = PipelineManager;

