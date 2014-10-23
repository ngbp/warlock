require( 'should' );
var sinon = require( 'sinon' );
var PipelineManager = require( './pipeline-manager' );
var Pipeline = require( './pipeline' );
var TaskManager = require( './task-manager' );
var util = require( './utilities' );
var di = require( 'di' );

describe( 'PipelineManager', function () {
  var MockTaskManager = function () {
  };
  di.annotate( MockTaskManager, new di.Provide( TaskManager ) );
  MockTaskManager.prototype.add = sinon.spy();

  beforeEach( function () {
    var injector = new di.Injector([ MockTaskManager ]);

    this.pipelineManager = injector.get( PipelineManager );
    this.taskManager = injector.get( TaskManager );
  });

  it( 'should inherit from EventEmitter', function () {
    (this.pipelineManager instanceof require( 'events' ).EventEmitter ).should.be.ok;
  });

  it( 'should keep a reference to the task manager', function () {
    this.pipelineManager._taskManager.should.be.instanceof( MockTaskManager );
  });

  describe( '#add', function () {
    var pipelineName;

    beforeEach( function () {
      pipelineName = 'hello';
    });

    it( 'should add an existing Pipeline', function () {
      var pipeline = new Pipeline( pipelineName );
      this.pipelineManager.add( pipeline );
      this.pipelineManager.get( pipelineName ).should.equal( pipeline );
    });

    it( 'should create a new pipeline when provided with a string', function () {
      this.pipelineManager.add( 'new', {} );
      this.pipelineManager.get( 'new' ).name().should.eql( 'new' );
    });

    it( 'should throw when neither a string nor Pipeline is provided', function () {
      ( function () { this.pipelineManager.add( 123 ); }).should.throw();
    });
  });

  describe( '#get', function () {
    var pipelineName;
    var pipeline;

    beforeEach( function () {
      pipelineName = 'hello';
      this.pipelineManager.add( new Pipeline( pipelineName ) );
    });

    it( 'should return an existing pipeline', function () {
      this.pipelineManager.get( pipelineName ).name().should.eql( pipelineName );
    });

    it( 'should return undefined for a nonexistent pipeline', function () {
      ( this.pipelineManager.get( 'non-existent' ) === undefined ).should.be.ok;
    });

    it( 'should return undefined when a string is not provided', function () {
      ( this.pipelineManager.get( 123 ) === undefined ).should.be.ok;
    });
  });

  describe( '#tasks', function () {
    var streamError;

    beforeEach( function () {
      streamError = new Error( 'No!' );
    });

    describe( 'when there are no pipelines defined', function () {
      it( 'should return an empty array', function () {
        this.pipelineManager.tasks().should.be.an.Array.with.lengthOf( 0 );
      });
    });

    describe( 'when there are pipelines defined', function () {
      it( 'should return an array of objects, one for each pipeline', function () {
        this.pipelineManager.add( 'pipeline-1' );
        this.pipelineManager.add( 'pipeline-2' );
        this.pipelineManager.tasks().should.be.an.Array.with.lengthOf( 2 );
      });

      it( 'should include the task name for each pipeline', function () {
        this.pipelineManager.add( 'pipeline-1' );
        this.pipelineManager.tasks()[0].should.have.property( 'name' ).and.be.a.String;
      });

      it( 'should include a function for each pipeline', function () {
        this.pipelineManager.add( 'pipeline-1' );
        this.pipelineManager.tasks()[0].should.have.property( 'fn' ).and.be.a.Function;
      });

      it( 'should include a function for each pipeline that returns a stream', function () {
        this.pipelineManager.add( 'pipeline-1', { source: util.stream([ 1, 2, 3 ]) } );
        util.types.isStream( this.pipelineManager.tasks()[0].fn() ).should.be.ok;
      });
    });

    describe( 'when a pipeline has dependencies', function () {
      it( 'should pass through a dependencies array', function () {
        this.pipelineManager.add( 'with-deps' , { depends: [ 'one', 'two', 'three' ] } );
        this.pipelineManager.tasks()[0].depends.should.be.an.Array.with.lengthOf( 3 );
      });
    });

    describe( 'when pipeline succeeds', function () {
      it( 'should return a stream with an array of values', function ( done ) {
        this.pipelineManager.add( 'pipeline-success', { source: util.stream([ 1, 2, 3 ]) });
        this.pipelineManager.tasks()[0].fn()
        .apply( function ( res ) {
          res.should.be.an.Array.with.lengthOf( 3 );
          done();
        });
      });
    });

    describe( 'when pipeline errors out', function () {
      it( 'should return a stream with an error', function ( done ) {
        this.pipelineManager.add( 'pipeline-error', { source: util.stream.reject( streamError ) });
        this.pipelineManager.tasks()[0].fn()
        .stopOnError( function ( err ) {
          err.should.eql( streamError );
          done();
        }).resume();
      });
    });
  });
});

