/* jshint expr: true */
require( 'should' );
var sinon = require( 'sinon' );
var ConfigManager = require( './config-manager' );
var di = require( 'di' );

describe( 'ConfigManager', function () {
  beforeEach( function () {
    var $injector = new di.Injector();
    this._configMgr = $injector.get( ConfigManager );
  });

  describe( '#getRaw', function () {
    it( 'should get a value by path', function () {
      this._configMgr._config = { one: { two: 'three' } };
      this._configMgr.getRaw( 'one.two' ).should.eql( 'three' );
    });
  });

  describe( '#get', function () {
    it( 'should return a number from the config', function () {
      this._configMgr._config = { one: { two: 3 } };
      this._configMgr.get( 'one.two' ).should.eql( 3 );
    });

    it( 'should pass through an undefined value from the config', function () {
      this._configMgr._config = { one: { two: undefined } };
      ( this._configMgr.get( 'one.two' ) === undefined ).should.be.ok;
    });

    it( 'should process template strings based on the config, recursively', function () {
      this._configMgr._config = { alpha: '<%= one.two %>', one: { two: 'three' } };
      this._configMgr.get( 'alpha' ).should.eql( 'three' );
    });
  });

  describe( '#set', function () {
    it( 'should set a value on the config object', function () {
      var key = 'hello';
      var val = 'world';
      this._configMgr.set( key, val );
      this._configMgr.getRaw( key ).should.eql( val );
    });

    it( 'should return the set value', function () {
      var key = 'hello';
      var val = 'world';
      this._configMgr.set( key, val ).should.eql( val );
    });

    it( 'should set a nested value on the config object', function () {
      var key = 'hello.one.two';
      var val = 'world';
      this._configMgr.set( key, val );
      this._configMgr._config.should.have.propertyByPath( key.split( '.' ) );
      this._configMgr.getRaw( key ).should.eql( val );
    });

    it( 'should merge objects', function () {
      var key = 'hello';

      var val1 = {
        prop1: 'hello'
      };
      var val2 = {
        prop2: 'world'
      };
      var expected = {
        prop1: 'hello',
        prop2: 'world'
      };

      this._configMgr.set( key, val1 );
      this._configMgr.set( key, val2 );
      this._configMgr.getRaw( key ).should.containDeep( expected );
    });

    it( 'should respect the nomerge flag for objects', function () {
      var key = 'hello';

      var val1 = {
        prop1: 'hello'
      };
      var val2 = {
        prop2: 'world'
      };

      this._configMgr.set( key, val1 );
      this._configMgr.set( key, val2, true );
      this._configMgr.getRaw( key ).should.eql( val2 );
    });
  });

  describe( '#merge', function () {
    it( 'should merge a new object into the config', function () {
      this._configMgr._config = {
        a: 'hello',
        b: {
          c: 'world',
          d: [ 'a', 'b', 'c' ]
        }
      };

      var toMerge = {
        e: 'new',
        b: {
          c: 'changed',
          d: [ 'new' ],
          f: 'new'
        }
      };

      var expected = {
        a: 'hello',
        b: {
          c: 'changed',
          d: [ 'a', 'b', 'c', 'new' ],
          f: 'new'
        },
        e: 'new',
      };

      this._configMgr.merge( toMerge );
      this._configMgr._config.should.containDeep( expected );
    });
  });

  describe( '#_process', function () {
    it( 'should process template strings based on the config', function () {
      this._configMgr._config = { one: { two: 'three' } };
      this._configMgr._process( '<%= one.two %>' ).should.eql( 'three' );
    });

    it( 'should pass through an undefined value from the config', function () {
      this._configMgr._config = { one: { two: undefined } };
      var res = this._configMgr._process( '<%= one.two %>' );
      ( ! res ).should.be.ok;
    });
  });
});

