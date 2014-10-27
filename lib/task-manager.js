var Orchestrator = require( 'orchestrator' );
var util = require( './utilities' );
var di = require( 'di' );
var ConfigManager = require( './config-manager' );

function TaskManager ( /* ConfigManager */ configMgr ) {
  TaskManager.super_.call( this );

  this._configManager = configMgr;
}
util.extend( TaskManager, Orchestrator );
di.annotate( TaskManager, new di.Inject( ConfigManager ) );

TaskManager.prototype.get = function () {
  return this.tasks;
};

TaskManager.prototype.createFromConfig = function () {
  var taskManager = this;
  var tasks = this._configManager.get( 'tasks' );

  if ( ! util.types.isObject( tasks ) ) {
    return;
  }

  Object.keys( tasks ).forEach( function ( name ) {
    taskManager.add( name, tasks[ name ] );
  });
};

module.exports = TaskManager;

