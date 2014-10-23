require( 'should' );
var util = require( './utilities' );

describe( 'utilities', function () {
  describe( '.types', function () {
    describe( '#isString', function () {
      it( 'should correctly identify a string', function () {
        var s1 = "hello";
        var s2 = new String( "world" );

        util.types.isString( s1 ).should.be.true;
        util.types.isString( s2 ).should.be.true;
      });

      it( 'should correctly identify when not a string', function () {
        util.types.isString( {} ).should.be.false;
        util.types.isString( 23 ).should.be.false;
      });
    });

    describe( '#isObject', function () {
      it( 'should correctly identify an object', function () {
        var o = {};

        util.types.isObject( o ).should.be.true;
        util.types.isObject( 'hello' ).should.be.false;
      });
    });

    describe( '#isArray', function () {
      it( 'should correctly identify an array', function () {
        var o = [];

        util.types.isArray( o ).should.be.true;
        util.types.isArray( 'hello' ).should.be.false;
      });
    });
  });

  describe( '.stream', function () {
    describe( '#reject', function () {
      it( 'should return a stream that errors out', function ( done ) {
        var error = false;

        util.stream.reject( new Error( "error" ) )
        .errors( function ( err, push ) {
          error = true;
          push( null, err );
        })
        .toArray( function () {
          error.should.be.ok;
          done();
        });
      });

      it( 'should use the error provided', function ( done ) {
        var error = '123456';

        util.stream.reject( error )
        .stopOnError( function ( err ) {
          err.should.eql( error );
          done();
        }).resume();
      });
    });
  });
});

