require( 'should' );
var sinon = require( 'sinon' );
var Bootstrapper = require( './bootstrapper' );
var PipelineManager = require( './pipeline-manager' );
var TaskManager = require( './task-manager' );
var ConfigManager = require( './config-manager' );
var util = require( './utilities' );
var di = require( 'di' );
var path = require( 'path' );

describe( 'Bootstrapper', function () {
  var mockTasks;

  beforeEach( function () {
    function MockTaskManager () {}
    MockTaskManager.prototype.add = function () {};
    di.annotate( MockTaskManager, new di.Provide( TaskManager ) );

    function MockPipelineManager () {}
    MockPipelineManager.prototype.tasks = function () { return mockTasks };
    di.annotate( MockPipelineManager, new di.Provide( PipelineManager ) );

    var $injector = new di.Injector( [ MockTaskManager, MockPipelineManager ] );
    this.taskManager = $injector.get( TaskManager );
    this.pipelineManager = $injector.get( PipelineManager );
    this.bootstrapper = $injector.get( Bootstrapper );
    this.configManager = $injector.get( ConfigManager );

    mockTasks = [];
    sinon.spy( this.taskManager, 'add' );
    sinon.spy( this.pipelineManager, 'tasks' );
  });

  describe( '#createPipelineTasks', function () {
    var spy1, spy2, spy3;

    beforeEach( function () {
      spy1 = sinon.spy();
      spy2 = sinon.spy();
      spy3 = sinon.spy();

      mockTasks.push({ name: '$$1', depends: [], fn: spy1 });
      mockTasks.push({ name: '$$2', depends: [], fn: spy2 });
      mockTasks.push({ name: '$$3', depends: [], fn: spy3 });

      this.bootstrapper.createPipelineTasks();
    });

    it( 'should get tasks from the pipeline manager', function () {
      this.pipelineManager.tasks.calledOnce.should.be.ok;
    });

    it( 'should add a new task for each item', function () {
      this.taskManager.add.calledThrice.should.be.ok;
    });

    it( 'should pass in the parameters from the pipeline manager', function () {
      this.taskManager.add.firstCall.calledWithExactly( '$$1', [], spy1 ).should.be.ok;
    });
  });

  describe( '#mergeConfigFromFile', function() {
    beforeEach( function () {
      this.path = path.join( __dirname, '..', 'test', 'dummy.json' );
    });

    it( 'should read return a stream', function () {
      util.stream.isStream( this.bootstrapper.mergeConfigFromFile( this.path ) ).should.be.ok;
    });

    it( 'should return an object parsed from JSON', function ( done ) {
      this.bootstrapper.mergeConfigFromFile( this.path )
      .apply( function ( obj ) {
        obj.a.b.should.eql( 'hello' );
        done();
      });
    });

    it( 'should merge only a subset of JSON if the `root` property is specified', function ( done ) {
      this.bootstrapper.mergeConfigFromFile( this.path, 'a' )
      .apply( function ( obj ) {
        obj.b.should.eql( 'hello' );
        done();
      });
    });

    it( 'should merge an empty object if a non-existent `root` property is specified', function ( done ) {
      this.bootstrapper.mergeConfigFromFile( this.path, 'nonexistent' )
      .apply( function ( obj ) {
        Object.keys( obj ).length.should.be.exactly( 0 );
        done();
      });
    });
  });

  describe( '#engage', function () {
    it( 'should emit start when called', function ( done ) {
      this.bootstrapper.on( 'start', function () {
        done();
      });

      this.bootstrapper.engage();
    });

    it( 'should emit done on finish', function ( done ) {
      this.bootstrapper.on( 'error', function ( err ) {
        throw err;
      });

      this.bootstrapper.on( 'done', function () {
        done();
      });

      this.bootstrapper.engage();
    });

    it( 'should merge the warlock config from package.json', function ( done ) {
      cfg = this.configManager;

      this.bootstrapper.on( 'done', function () {
        cfg.getRaw( 'testFromPackage' ).should.eql( 'hello' );
        done();
      });

      this.bootstrapper.engage();
    });

    it( 'should merge the config from warlock.json', function ( done ) {
      cfg = this.configManager;

      this.bootstrapper.on( 'done', function () {
        cfg.getRaw( 'testFromWarlock' ).should.eql( 'hello' );
        done();
      });

      this.bootstrapper.engage();
    });
  });
});

