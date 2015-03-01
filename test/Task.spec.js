import chai from 'chai'
import WarlockTask from '../src/Task'
import immutable from 'immutable'
import _ from 'highland'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'

chai.use( sinonChai );
var expect = chai.expect;
var Map = immutable.Map;

describe( 'WarlockTask', function () {
  beforeEach( function () {
    this.name = 'TaskName';

    this.task = new WarlockTask( this.name );
  });

  describe( 'constructor()', function () {
    it( 'should instantiate a new instance of WarlockTask', function () {
      expect( this.task ).to.be.an.instanceOf( WarlockTask );
    });

    it( 'should throw when missing a name', function () {
      expect( () => new WarlockTask() ).to.throw( /have a name/ );
    });
  });

  describe( 'options()', function () {
    it( 'should return an immutable map', function () {
      expect( this.task.options() ).to.be.an.instanceOf( Map );
    });

    it( 'should have "name" as a top-level key', function () {
      expect( this.task.options().has( '$$name' ) ).to.be.ok;
    });

    it( 'should have the task name under the "name" key', function () {
      expect( this.task.options().get( '$$name' ) ).to.eql( this.name );
    });
  });

  describe( 'name()', function () {
    it( 'should return the name of the task', function () {
      expect( this.task.name() ).to.eql( this.name );
    });
  });

  describe( '_run()', function () {
    beforeEach( function () {
      this.stream = _();
      sinon.spy( this.task, 'run' );
    });

    describe( 'given no environment is specified', function () {
      it( 'should return a stream', function () {
        expect( _.isStream( this.task._run( this.stream ) ) ).to.be.ok;
      });

      it( 'should execute the task', function () {
        this.task._run( this.stream );
        expect( this.task.run ).to.have.been.called;
      });
    });

    describe( 'given a single specified environment', function () {
      beforeEach( function () {
        this.task = new WarlockTask( this.name, { environment: 'prod' } );
        sinon.spy( this.task, 'run' );
      });

      describe( 'and there is no provided version', function () {
        it( 'should execute the stream', function () {
          this.task._run( this.stream, Map({}) );
          expect( this.task.run ).to.have.been.called;
        });
      });

      describe( 'and that it does not match the provided version', function () {
        it( 'should not execute the stream', function () {
          this.task._run( this.stream, Map({ environment: 'dev' }) );
          expect( this.task.run ).to.not.have.been.called;
        });
      });

      describe( 'and that it matches the provided version', function () {
        it( 'should execute the stream', function () {
          this.task._run( this.stream, Map({ environment: 'prod' }) );
          expect( this.task.run ).to.have.been.called;
        });
      });
    });

    describe( 'given a multiple specified environments', function () {
      beforeEach( function () {
        this.task = new WarlockTask( this.name, { environment: [ 'stage', 'prod' ] } );
        sinon.spy( this.task, 'run' );
      });

      describe( 'and there is no provided version', function () {
        it( 'should execute the stream', function () {
          this.task._run( this.stream, Map({}) );
          
          expect( this.task.run ).to.have.been.called;
        });
      });

      describe( 'and none matches the provided version', function () {
        it( 'should not execute the stream', function () {
          this.task._run( this.stream, Map({ environment: 'dev' }) );
          expect( this.task.run ).to.not.have.been.called;
        });
      });

      describe( 'and that one matches the provided version', function () {
        it( 'should execute the stream', function () {
          this.task._run( this.stream, Map({ environment: 'prod' }) );
          expect( this.task.run ).to.have.been.called;
        });
      });
    });
  });
});

