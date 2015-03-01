import {expect} from 'chai'
import WarlockTask from '../src/Task'
import immutable from 'immutable'
import _ from 'highland'

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
      expect( this.task.options() ).to.be.an.instanceOf( immutable.Map );
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
    it( 'should return a stream', function () {
      var stream = _();
      expect( _.isStream( this.task._run( stream ) ) ).to.be.ok;
    });
  });
});

