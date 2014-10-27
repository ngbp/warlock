/* jshint expr: true */
require( 'should' );
var TaskManager = require( './task-manager' );
var ConfigManager = require( './config-manager' );
var sinon = require( 'sinon' );
var di = require( 'di' );

describe( 'TaskManager', function () {
  beforeEach( function () {
    var injector = new di.Injector();
    this.taskManager = injector.get( TaskManager );
    this.configManager = injector.get( ConfigManager );

    sinon.spy( this.taskManager, 'add' );
  });

  it( 'should inhert from Orchestrator', function () {
    (this.taskManager instanceof require( 'orchestrator' ) ).should.be.ok;
  });

  describe( '#get', function () {
    it( 'should return all tasks from Orchestrator', function () {
      this.taskManager.get().should.equal( this.taskManager.tasks );
    });
  });

  describe( '#createFromConfig', function () {
    describe( 'given there are tasks defined', function () {
      it( 'should add a new task for each in the config', function () {
        this.configManager.set( 'tasks', {
          'task-1': [],
          'task-2': []
        });

        this.taskManager.createFromConfig();
        this.taskManager.add.calledTwice.should.be.ok;
      });

      it( 'should pass through the dependencies', function () {
        var deps = [ '1', '2' ];
        this.configManager.set( 'tasks', {
          'task-1': deps
        });

        this.taskManager.createFromConfig();
        this.taskManager.tasks[ 'task-1' ].dep.should.eql( deps );
      });
    });

    describe( 'given there are no tasks', function () {
      it( 'should pass through the dependencies', function () {
        this.configManager.set( 'tasks', {});
        this.taskManager.createFromConfig();
        this.taskManager.add.called.should.not.be.ok;
      });
    });

    describe( 'given tasks is not an object', function () {
      it( 'should pass through the dependencies', function () {
        this.configManager.set( 'tasks', 'hello');
        this.taskManager.createFromConfig();
        this.taskManager.add.called.should.not.be.ok;
      });
    });
  });
});

