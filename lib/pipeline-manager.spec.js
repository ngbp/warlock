/* jshint expr: true */
require( 'should' );
var sinon = require( 'sinon' );
var PipelineManager = require( './pipeline-manager' );
var Pipeline = require( './pipeline' );
var TaskManager = require( './task-manager' );
var ConfigManager = require( './config-manager' );
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
    this.configManager = injector.get( ConfigManager );
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

  describe( '#createFromConfig', function () {
    describe( 'given there are no pipelines', function () {
      it( 'should return, doing nothing', function () {
        this.pipelineManager.createFromConfig();
        Object.keys( this.pipelineManager._pipelines ).should.have.lengthOf( 0 );
      });
    });

    describe( 'given the pipeline key is not an object', function () {
      it( 'should return, doing nothing', function () {
        this.configManager.set( 'pipelines', 'hello' );
        this.pipelineManager.createFromConfig();
        Object.keys( this.pipelineManager._pipelines ).should.have.lengthOf( 0 );
      });
    });

    describe( 'given there are pipelines', function () {
      it( 'should add a new pipeline for each key in the object', function () {
        this.configManager.set( 'pipelines', {
          'pl-1': {},
          'pl-2': {}
        });

        this.pipelineManager.createFromConfig();
        Object.keys( this.pipelineManager._pipelines ).should.eql([ 'pl-1', 'pl-2' ]);
      });
    });

    describe( 'given the pipelines have a "files" array', function () {
      it( 'should convert the files array to a stream', function () {
        this.configManager.set( 'pipelines', {
          'pl-1': {
            files: [ 'test/src/*.txt' ]
          }
        });

        this.pipelineManager.createFromConfig();
        util.stream.isStream( this.pipelineManager.get( 'pl-1' )._options.source ).should.be.ok;
      });

      it( 'should remove the files array from the config', function () {
        this.configManager.set( 'pipelines', {
          'pl-1': {
            files: [ 'test/src/*.txt' ]
          }
        });

        this.pipelineManager.createFromConfig();
        this.pipelineManager.get( 'pl-1' )._options.should.not.have.property( 'files' );
      });
      it( 'should convert the files array to a stream', function () {
        this.configManager.set( 'pipelines', {
          'pl-1': {
            files: [ 'test/src/*.txt' ]
          }
        });

        this.pipelineManager.createFromConfig();
        util.types.isStream( this.pipelineManager.get( 'pl-1' )._options.source ).should.be.ok;
      });
    });

    describe( 'given the pipelines have a "files" string', function () {
      it( 'should convert the files string to a stream', function () {
        this.configManager.set( 'pipelines', {
          'pl-1': {
            files: 'test/src/*.txt'
          }
        });

        this.pipelineManager.createFromConfig();
        util.types.isStream( this.pipelineManager.get( 'pl-1' )._options.source ).should.be.ok;
      });
    });

    describe( 'given the pipelines have a "dest" string', function () {
      it( 'should convert the dest string to a stream', function () {
        this.configManager.set( 'pipelines', {
          'pl-1': {
            files: 'test/src/*.txt',
            dest: 'my/path'
          }
        });

        this.pipelineManager.createFromConfig();
        util.types.isStream( this.pipelineManager.get( 'pl-1' )._options.dest ).should.be.ok;
      });
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

      describe( 'given a pipeline has dependencies', function () {
        it( 'should pass through a dependencies array', function () {
          this.pipelineManager.add( 'with-deps' , { depends: [ 'one', 'two', 'three' ] } );
          this.pipelineManager.tasks()[0].depends.should.be.an.Array.with.lengthOf( 3 );
        });
      });

      describe( 'given a pipeline has a join', function () {
        it( 'should add it to the joinee\'s dependencies array', function () {
          this.pipelineManager.add( 'a' , { depends: [ 'one' ] } );
          this.pipelineManager.add( 'b' , { join: { target: 'a' } } );
          this.pipelineManager.tasks()[0].depends.should.be.an.Array.with.lengthOf( 2 );
        });
      });

      describe( 'given there is no phase defined', function () {
        it( 'should pass no phase to the pipeline', function () {
          var pipeline = this.pipelineManager.add( 'p1' );
          var p1task = this.pipelineManager.tasks()[0];

          pipeline.run = sinon.spy();
          p1task.fn().resume();
          pipeline.run.calledWith( undefined ).should.be.true;
        });
      });

      describe( 'given there is a phase defined', function () {
        it( 'should pass the current phase to the pipeline', function () {
          var phase = 'dev';
          var pipeline = this.pipelineManager.add( 'p1' );

          this.configManager.set( '$phase', phase );
          var p1task = this.pipelineManager.tasks()[0];

          pipeline.run = sinon.spy();
          p1task.fn().resume();
          pipeline.run.calledWith( phase ).should.be.true;
        });
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

    describe( 'when a pipeline joins with another', function () {
      var doubleIt = util.stream.map( function ( x ) { return x * 2; } );

       describe( 'when the join target does not exist', function () {
         it( 'should return a stream with an error', function ( done ) {
          this.pipelineManager.add( 'p2', {
            source: util.stream([ 4, 5, 6 ]),
            join: { target: 'p1', before: 'double' }
          });

          var tasks = this.pipelineManager.tasks();
          var p2 = tasks[0];
          
          p2.fn().stopOnError( function ( err ) {
            err.should.be.an.Error;
            done();
          }).resume();
         });
       });

       describe( 'when a join point is not specified', function () {
         it( 'should return a stream with an error', function ( done ) {
          this.pipelineManager.add( 'p1', {
            source: util.stream([ 1, 2, 3 ])
          }).append( 'double', doubleIt );

          this.pipelineManager.add( 'p2', {
            source: util.stream([ 4, 5, 6 ]),
            join: { target: 'p1' }
          });

          var tasks = this.pipelineManager.tasks();
          var p2 = tasks[1];
          
          p2.fn().stopOnError( function ( err ) {
            err.should.be.an.Error;
            done();
          }).resume();
         });
       });

      it( 'when before, should contain values before the mentioned stream', function ( done ) {
        this.pipelineManager.add( 'p1', {
          source: util.stream([ 1, 2, 3 ])
        }).append( 'double', doubleIt );

        this.pipelineManager.add( 'p2', {
          source: util.stream([ 4, 5, 6 ]),
          join: { target: 'p1', before: 'double' }
        });

        var tasks = this.pipelineManager.tasks();
        var p1 = tasks[0];
        var p2 = tasks[1];
        
        p2.fn()
        .apply( function ( res ) {
          p1.fn()
          .apply( function ( res ) {
            res.should.eql([ 2, 4, 6, 8, 10, 12 ]);
            done();
          });
        });
      });

      it( 'when after, should contain values after the mentioned stream', function ( done ) {
        this.pipelineManager.add( 'p1', {
          source: util.stream([ 1, 2, 3 ])
        }).append( 'double', doubleIt );

        this.pipelineManager.add( 'p2', {
          source: util.stream([ 4, 5, 6 ]),
          join: { target: 'p1', after: 'double' }
        });

        var tasks = this.pipelineManager.tasks();
        var p1 = tasks[0];
        var p2 = tasks[1];
        
        p2.fn()
        .apply( function ( res ) {
          p1.fn()
          .apply( function ( res ) {
            res.should.eql([ 2, 4, 6, 4, 5, 6 ]);
            done();
          });
        });
      });

      it( 'when prepend, should contain values at the beginning', function ( done ) {
        this.pipelineManager.add( 'p1', {
          source: util.stream([ 1, 2, 3 ])
        }).append( 'double', doubleIt );

        this.pipelineManager.add( 'p2', {
          source: util.stream([ 4, 5, 6 ]),
          join: { target: 'p1', prepend: true }
        });

        var tasks = this.pipelineManager.tasks();
        var p1 = tasks[0];
        var p2 = tasks[1];
        
        p2.fn()
        .apply( function ( res ) {
          p1.fn()
          .apply( function ( res ) {
            res.should.eql([ 2, 4, 6, 8, 10, 12 ]);
            done();
          });
        });
      });

      it( 'when append, should contain values at the end', function ( done ) {
        this.pipelineManager.add( 'p1', {
          source: util.stream([ 1, 2, 3 ])
        }).append( 'double', doubleIt );

        this.pipelineManager.add( 'p2', {
          source: util.stream([ 4, 5, 6 ]),
          join: { target: 'p1', append: true }
        });

        var tasks = this.pipelineManager.tasks();
        var p1 = tasks[0];
        var p2 = tasks[1];
        
        p2.fn()
        .apply( function ( res ) {
          p1.fn()
          .apply( function ( res ) {
            res.should.eql([ 2, 4, 6, 4, 5, 6 ]);
            done();
          });
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

