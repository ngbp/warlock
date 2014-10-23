require( 'should' );
var Pipeline = require( './pipeline' );
var _ = require( 'highland' );
var rimraf = require( 'rimraf' );
var fs = require( 'fs' );
var path = require( 'path' );
var util = require( './utilities' );
var esMap = require( 'map-stream' );

describe( 'Pipeline', function () {
  var destDirectory = 'test/dest'
  var fromDirectory = 'test/src/**.txt';
  var pipelineName = 'test-pipeline';

  beforeEach( function () {
    this.pipeline = new Pipeline( pipelineName );
  });

  describe( '#name', function () {
    it( 'should return the name of the pipeline', function () {
      this.pipeline.name().should.eql( pipelineName );
    });
  });

  describe( '#taskName', function () {
    it( 'should return the name of the pipeline prefixed by two dollar signs', function () {
      this.pipeline.taskName().should.eql( '$$' + pipelineName );
    });
  });

  describe( '#depends', function () {
    describe( 'when dependencies exist', function () {
      it( 'should return a copy of the dependencies', function () {
        this.pipeline._options.depends = [ 'one', 'two' ];
        this.pipeline.depends().should.be.an.Array.with.lengthOf( 2 );
      });
    });

    describe( 'when no dependencies exist', function () {
      it( 'should return an empty array', function () {
        this.pipeline.depends().should.be.an.Array.with.lengthOf( 0 );
      });
    });
  });

  describe( '#prepend', function () {
    it( 'should put items before what\'s there', function () {
      this.pipeline.prepend( '1' );
      this.pipeline.prepend( '2' );
      this.pipeline.prepend( '3' );

      this.pipeline._streamIndex.should.eql( [ '3', '2', '1' ]);
    });
  });

  describe( '#append', function () {
    it( 'should put items after what\'s there', function () {
      this.pipeline.append( '1' );
      this.pipeline.append( '2' );
      this.pipeline.append( '3' );

      this.pipeline._streamIndex.should.eql( [ '1', '2', '3' ]);
    });
  });

  describe( '#after', function () {
    it( 'should put items after the specified dependency', function () {
      this.pipeline.append( '2' );
      this.pipeline.append( '4' );
      this.pipeline.after( '2', '3' );
      this.pipeline.prepend( '1' );

      this.pipeline._streamIndex.should.eql( [ '1', '2', '3', '4' ]);
    });
  });

  describe( '#before', function () {
    it( 'should put items before the specified dependency', function () {
      this.pipeline.append( '2' );
      this.pipeline.append( '3' );
      this.pipeline.before( '2', '1' );
      this.pipeline.append( '4' );

      this.pipeline._streamIndex.should.eql( [ '1', '2', '3', '4' ]);
    });
  });

  describe( '#_pipeline', function () {
    it( 'should create a pipeline from the streams added', function ( done ) {
      var startingValues = [ 1, 2, 3 ];
      var targetValues = startingValues.map( function ( v ) {
        return (v * 2) + 1;
      });

      this.pipeline.append( 'double', _.map( function ( x ) {
        return x * 2;
      }));

      this.pipeline.append( 'add', _.map( function ( x ) {
        return x + 1;
      }));

      this.pipeline._options.source = _( startingValues );

      this.pipeline._pipeline()
        .toArray( function ( values ) {
          values.should.eql( targetValues );
          done();
        });
    });
  });

  describe( '#run', function () {
    beforeEach( function ( done ) {
      this.pipeline = new Pipeline( 'test-pipeline', {
        source: util.stream.fromFs( [ fromDirectory ] ),
        dest: util.stream.toFs( destDirectory )
      });

      rimraf( destDirectory, done );
    });

    it( 'should emit a `start` event', function ( done ) {
      var start = false;

      this.pipeline.on( 'start', function () {
        start = true;
      });

      this.pipeline.on( 'end', function () {
        start.should.be.ok;
        done();
      });

      this.pipeline.run();
    });

    it( 'should run the pipeline with only a source and dest', function ( done ) {
      this.pipeline.on( 'end', function ( res ) {
        res.should.be.an.Array.and.have.lengthOf( 2 );
        done();
      });

      this.pipeline.run();
    });

    it( 'should run the pipeline with only a source', function ( done ) {
      this.pipeline.on( 'end', function ( res ) {
        res.should.be.an.Array.and.have.lengthOf( 2 );
        done();
      });

      this.pipeline.run();
    });

    it( 'should run the pipeline using the provided source and dest', function ( done ) {
      this.pipeline.append( 'capitalize', _.map( function ( file ) {
        file.contents = new Buffer( file.contents.toString().toUpperCase() );
        return file;
      }));

      this.pipeline.on( 'end', function ( res ) {
        res.should.be.an.Array.and.have.lengthOf( 2 );

        var one = fs.readFileSync( path.join( destDirectory, 'one.txt' ) );
        var two = fs.readFileSync( path.join( destDirectory, 'two.txt' ) );

        // We ust startWith because the Buffer-to-string conversion is adding an extra newline that
        // is not present in the file.
        one.toString().should.startWith( 'HELLO' );
        two.toString().should.startWith( 'WORLD' );
        done();
      });

      this.pipeline.run();
    });

    it( 'should pass through an error when there is no source', function ( done ) {
      this.pipeline._options.source = undefined;

      this.pipeline.on( 'error', function ( err ) {
        err.should.be.an.Error;
        done();
      });

      this.pipeline.run();
    });

    it( 'should run the pipeline even when there is no dest', function ( done ) {
      this.pipeline._options.dest = undefined;

      this.pipeline.append( 'capitalize', _.map( function ( file ) {
        file.contents = new Buffer( file.contents.toString().toUpperCase() );
        return file;
      }));
      
      this.pipeline.on( 'end', function ( res ) {
        res.should.be.an.Array.and.have.lengthOf( 2 );
        done();
      });

      this.pipeline.run();
    });

    it( 'should pass through an error when a non-highland stream throws', function ( done ) {
      this.pipeline.append( 'something-that-works', _.map( function ( x ) {
        return x;
      }));

      this.pipeline.append( 'something-that-errors', esMap( function ( x, cb ) {
        cb( new Error( "Oh no!" ) );
      }));

      this.pipeline.on( 'error', function ( err ) {
        err.should.be.an.Error;
        done();
      });

      this.pipeline.run();
    });

    it( 'should pass through an error when a highland function throws', function ( done ) {
      this.pipeline.append( 'something-that-errors', _.map( function ( x ) {
        throw new Error( "Oh no!" );
      }));

      this.pipeline.append( 'something-that-works', _.map( function ( x ) {
        return x;
      }));

      this.pipeline.on( 'error', function ( err ) {
        err.should.be.an.Error;
        done();
      });

      this.pipeline.run();
    });

    it( 'should emit an error when the source throws', function ( done ) {
      this.pipeline._options.source = _( function ( push, next ) {
        push( new Error( "Oh no!" ) );
        push( util.stream.nil );
        next();
      });

      this.pipeline.append( 'dummy', _.map( function ( x ) {
        console.log("HERE");
        return x;
      }));

      this.pipeline.on( 'error', function ( err ) {
        err.should.be.an.Error;
        done();
      });

      this.pipeline.run();
    });

    it( 'should emit an error when the dest throws', function ( done ) {
      this.pipeline._options.dest = util.stream.map( function ( x ) {
        throw new Error( "Oh no!" );
      });

      this.pipeline.append( 'dummy', _.map( function ( x ) {
        return x;
      }));

      this.pipeline.on( 'error', function ( err ) {
        err.should.be.an.Error;
        done();
      });

      this.pipeline.run();
    });
  });
});

