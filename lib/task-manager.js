var Orchestrator = require( 'orchestrator' );
var util = require( 'util' );

function TaskManager () {
  TaskManager.super_.call( this );
};
util.inherits( TaskManager, Orchestrator );

TaskManager.prototype.get = function () {
  return this.tasks;
};

module.exports = TaskManager;

