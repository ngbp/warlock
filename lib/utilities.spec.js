require( 'should' );
var util = require( './utilities' );
var _ = require( 'highland' );

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

    describe( '#fromJson', function () {
      it( 'should return a stream', function () {
        _.isStream( util.stream.fromJson( '{"a":"b"}' ) ).should.be.ok;
      });

      it( 'should put the parsed object on the stream', function ( done ) {
        util.stream.fromJson( '{"a":"b"}' ).apply( function ( obj ) {
          obj.should.be.ok;
          obj.a.should.eql( 'b' );
          done();
        });
      });

      it( 'should push an error to the stream if parsing fails', function ( done ) {
        var error = false;

        util.stream.fromJson( '{"a": this is not valid }' )
        .errors( function ( e, push ) {
          error = e;
          push( null, true );
        })
        .apply( function () {
          error.should.be.ok;
          done();
        });
      });
    });
  });

  describe( 'object', function () {
    describe( '#get', function () {
      it( 'should pull object keys from a string path', function () {
        var obj = {
          a: { b: 'hello' },
          c: 'world'
        };

        var c = util.object.get( obj, 'c' );
        var a = util.object.get( obj, 'a' );
        var ab = util.object.get( obj, 'a.b' );

        (c === undefined).should.be.false;
        c.should.equal( obj.c );

        (a === undefined).should.be.false;
        a.should.equal( obj.a );

        (ab === undefined).should.be.false;
        ab.should.equal( obj.a.b );
      });

      it( 'should return undefined for an invalid string path', function () {
        ( util.object.get( {}, 'a.b' ) === undefined ).should.be.true;
        ( util.object.get( { a: {} }, 'a.b' ) === undefined ).should.be.true;
      });

      it( 'should return undefined for a non-object', function () {
        ( util.object.get( 23, 'a.b' ) === undefined ).should.be.true;
      });

      it( 'should return undefined for an non-string path', function () {
        ( util.object.get( {}, 23 ) === undefined ).should.be.true;
      });
    });

    describe( '#set', function () {
      var obj;

      beforeEach( function () {
        obj = {
          a: { b: 'hello' },
          c: 'world',
          d: {
            e: [ '2' ]
          }
        };
      });

      it( 'should set an existing object value by path', function () {
        util.object.set( obj, 'c', 'another' );
        obj.c.should.eql( 'another' );
      });

      it( 'should set an existing object value by path, deeply', function () {
        util.object.set( obj, 'a.b', 'another' );
        obj.a.b.should.eql( 'another' );
      });

      it( 'should replace an array by path, deeply', function () {
        util.object.set( obj, 'd.e', [ 'another' ] );
        obj.d.e.should.eql( [ 'another' ] );
      });
    });

    describe( '#recurse', function () {
      it( 'should call a function for every primitive in an object, recursively', function () {
        var sourceObj = {
          a: 1,
          b: 2,
          c: [ 1, 2, 3 ],
          d: {
            e: 1,
            b: [ 1, 2, 3 ],
            c: {
              e: 1
            }
          }
        };

        var expectedObj = {
          a: 2,
          b: 4,
          c: [ 2, 4, 6 ],
          d: {
            e: 2,
            b: [ 2, 4, 6 ],
            c: {
              e: 2
            }
          }
        };

        var result = util.object.recurse( sourceObj, function ( val ) {
          return val * 2;
        });

        result.should.containDeepOrdered( expectedObj );
      });
    });
  });
});

