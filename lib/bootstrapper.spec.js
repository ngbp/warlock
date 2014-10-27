/* jshint expr: true */
require( 'should' );
var sinon = require( 'sinon' );
var Bootstrapper = require( './bootstrapper' );
var PipelineManager = require( './pipeline-manager' );
var TaskManager = require( './task-manager' );
var ConfigManager = require( './config-manager' );
var SpellManager = require( './spell-manager' );
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
    MockPipelineManager.prototype.tasks = function () { return mockTasks; };
    MockPipelineManager.prototype.createFromConfig = sinon.spy();
    di.annotate( MockPipelineManager, new di.Provide( PipelineManager ) );

    function MockSpellManager () {}
    MockSpellManager.prototype.loadNpmSpells = function () { return util.stream([{}]); };
    MockSpellManager.prototype.loadFromPath = function () { return util.stream([{}]); };
    MockSpellManager.prototype.runSpells = sinon.spy();
    di.annotate( MockSpellManager, new di.Provide( SpellManager ) );

    var $injector = new di.Injector( [ MockTaskManager, MockPipelineManager, MockSpellManager ] );
    this.taskManager = $injector.get( TaskManager );
    this.pipelineManager = $injector.get( PipelineManager );
    this.bootstrapper = $injector.get( Bootstrapper );
    this.configManager = $injector.get( ConfigManager );
    this.spellManager = $injector.get( SpellManager );

    mockTasks = [];
    sinon.spy( this.taskManager, 'add' );
    sinon.spy( this.pipelineManager, 'tasks' );
    sinon.spy( this.spellManager, 'loadNpmSpells' );
    sinon.spy( this.spellManager, 'loadFromPath' );
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

    it( 'should create pipelines from config', function ( done ) {
      var pipelineManager = this.pipelineManager;

      this.bootstrapper.on( 'done', function () {
        pipelineManager.createFromConfig.calledOnce.should.be.ok;
        done();
      });

      this.bootstrapper.engage();
    });

    it( 'should load spells from NPM modules', function ( done ) {
      var spellMgr = this.spellManager;

      this.bootstrapper.on( 'done', function () {
        spellMgr.loadNpmSpells.calledOnce.should.be.ok;
        done();
      });

      this.bootstrapper.engage();
    });

    it( 'should load spells from directories specified in config', function ( done ) {
      var spellMgr = this.spellManager;
      this.configManager.set( 'spells', [ 'dir1', 'dir2' ] );

      this.bootstrapper.on( 'done', function () {
        spellMgr.loadFromPath.calledTwice.should.be.ok;
        done();
      });

      this.bootstrapper.engage();
    });

    it( 'should not load spells if no directories specified in config', function ( done ) {
      var spellMgr = this.spellManager;
      this.configManager.set( 'spells', [] );

      this.bootstrapper.on( 'done', function () {
        spellMgr.loadFromPath.called.should.not.be.ok;
        done();
      });

      this.bootstrapper.engage();
    });

    it( 'should not load spells if spells in config is not an array', function ( done ) {
      var spellMgr = this.spellManager;
      this.configManager.set( 'spells', 'hello' );

      this.bootstrapper.on( 'done', function () {
        spellMgr.loadFromPath.called.should.not.be.ok;
        done();
      });

      this.bootstrapper.engage();
    });

    it( 'should not load spells if no spells array provided in config', function ( done ) {
      var spellMgr = this.spellManager;

      this.bootstrapper.on( 'done', function () {
        spellMgr.loadFromPath.called.should.not.be.ok;
        done();
      });

      this.bootstrapper.engage();
    });

    it( 'should run the spell functions', function ( done ) {
      var spellMgr = this.spellManager;

      this.bootstrapper.on( 'done', function () {
        spellMgr.runSpells.called.should.be.ok;
        done();
      });

      this.bootstrapper.engage();
    });

    it( 'should add a task for each pipeline', function ( done ) {
      var taskMgr = this.taskManager;

      mockTasks = [
        {
          name: 'pl1',
          depends: [ 'pl2' ],
          fn: sinon.spy()
        },
        {
          name: 'pl2',
          depends: [],
          fn: sinon.spy()
        }
      ];

      this.bootstrapper.on( 'done', function () {
        taskMgr.add.calledTwice.should.be.ok;
        done();
      });

      this.bootstrapper.engage();
    });

    it( 'should use the right parameters for the new task', function ( done ) {
      var taskMgr = this.taskManager;

      var mockTask = {
        name: 'pl1',
        depends: [ 'pl2' ],
        fn: sinon.spy()
      };
      mockTasks = [ mockTask ];

      this.bootstrapper.on( 'done', function () {
        taskMgr.add.calledWithExactly( mockTask.name, mockTask.depends, mockTask.fn ).should.be.ok;
        done();
      });

      this.bootstrapper.engage();
    });
  });
});

