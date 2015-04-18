import WarlockTask from '../src/Task'
import GulpTask from '../src/GulpTask'

import chai from 'chai'
import immutable from 'immutable'
import _ from 'highland'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import map from 'map-stream'

chai.use( sinonChai );
var expect = chai.expect;
var Map = immutable.Map;

describe.skip( 'GulpTask', function () {
  beforeEach( function () {
    this.name = 'GulpTaskName';
    this.sourceValues = [ 1, 2, 3 ];
    this.stream = _( this.sourceValues );

    this.task = new GulpTask( this.name, () => true );
  });

  describe( 'constructor()', function () {
    it( 'should instantiate a new instance of GulpTask', function () {
      expect( this.task ).to.be.an.instanceOf( GulpTask );
    });

    it( 'should extend WarlockTask', function () {
      expect( this.task ).to.be.an.instanceOf( WarlockTask );
    });

    it( 'should pass through the given name to the parent class', function () {
      expect( this.task.name() ).to.eql( this.name );
    });
  });

  describe( 'run()', function () {
    describe( 'given a stream is passed', function () {
      beforeEach( function () {
        var gulpTask = map( ( f, cb ) => {
          console.log("map", f);
          cb( null, f + 1 );
        });

        this.task = new GulpTask( this.name, gulpTask );
      });

      it( 'should return a stream', function () {
        expect( _.isStream( this.task._run( this.stream ) ) ).to.be.ok;
      });

      it( 'should pipe to the provided stream', function ( done ) {
        this.task._run( this.stream )
          .toArray( ( values ) => {
            expect( values ).to.eql([ 2, 3, 4 ]);
            done();
          });
      });
    });
  });
});

