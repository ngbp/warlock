require( 'should' );
var TaskManager = require( './task-manager' );
var di = require( 'di' );

describe( 'TaskManager', function () {
  beforeEach( function () {
    var injector = new di.Injector();
    this.taskMgr = injector.get( TaskManager );
  });

  it( 'should inhert from Orchestrator', function () {
    (this.taskMgr instanceof require( 'orchestrator' ) ).should.be.ok;
  });

  describe( '#get', function () {
    it( 'should return all tasks from Orchestrator', function () {
      this.taskMgr.get().should.equal( this.taskMgr.tasks );
    });
  });
});

