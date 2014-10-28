/* jshint expr: true */
require( 'should' );
var sinon = require( 'sinon' );
var di = require( 'di' );
var path = require( 'path' );
var util = require( './utilities' );
var ConfigManager = require( './config-manager' );
var SpellManager = require( './spell-manager' );
var PipelineManager = require( './pipeline-manager' );

describe( 'SpellManager', function () {
  beforeEach( function () {
    var inj = new di.Injector();
    this.spellManager = inj.get( SpellManager );
    this.configManager = inj.get( ConfigManager );

    sinon.spy( this.configManager, 'merge' );
  });

  describe( '#_isSpell', function () {
    it( 'should return true when the keyword is present', function () {
      var config = { keywords: [ 'warlockspell' ] };
      this.spellManager._isSpell( config ).should.be.ok;
    });

    it( 'should return false when the keyword is present', function () {
      var config = { keywords: [ 'another' ] };
      this.spellManager._isSpell( config ).should.not.be.ok;
    });

    it( 'should return false when the keywords array is not present', function () {
      var config = {};
      this.spellManager._isSpell( config ).should.not.be.ok;
    });
  });

  describe( '#_isSpellDisabled', function () {
    describe( 'given the spell is in the config', function () {
      it( 'should return true', function () {
        var config = { name: 'spell-name' };
        this.configManager.merge( { disabled: { spells: [ 'spell-name' ] } } );
        this.spellManager._isSpellDisabled( config ).should.be.ok;
      });
    });

    describe( 'given the spell is not in the config', function () {
      it( 'should return false', function () {
        var config = { name: 'spell-not-disabled' };
        this.configManager.merge( { disabled: { spells: [ 'spell-name' ] } } );
        this.spellManager._isSpellDisabled( config ).should.not.be.ok;
      });
    });

    describe( 'given there is no disabled spells array', function () {
      it( 'should return false', function () {
        var config = { name: 'spell-name' };
        this.spellManager._isSpellDisabled( config ).should.not.be.ok;
      });
    });

    describe( 'given the disabled spells key is not an array', function () {
      it( 'should return false', function () {
        var config = { name: 'spell-name' };
        this.configManager.merge( { disabled: { spells: 'spell-name' } } );
        this.spellManager._isSpellDisabled( config ).should.not.be.ok;
      });
    });
  });

  describe( '#_loadConfigFromPackageFile', function () {
    it( 'should return a function', function () {
      util.types.isFunction( this.spellManager._loadConfigFromPackageFile() ).should.be.ok;
    });

    it( 'should merge the config if the stream data has the warlock property', function ( done ) {
      var pipeline = util.stream.pipeline( this.spellManager._loadConfigFromPackageFile() );
      var cfg = this.configManager;
      
      util.stream([{ warlock: {} }])
        .pipe( pipeline )
        .apply( function () {
          cfg.merge.calledOnce.should.be.ok;
          done();
        });
    });

    it( 'should not merge without the warlock property', function ( done ) {
      var pipeline = util.stream.pipeline( this.spellManager._loadConfigFromPackageFile() );
      var cfg = this.configManager;
      
      util.stream([{}])
        .pipe( pipeline )
        .apply( function () {
          cfg.merge.called.should.not.be.ok;
          done();
        });
    });

    it( 'should not merge if the warlock property is not an object', function ( done ) {
      var pipeline = util.stream.pipeline( this.spellManager._loadConfigFromPackageFile() );
      var cfg = this.configManager;
      
      util.stream([{ warlock: 'hello' }])
        .pipe( pipeline )
        .apply( function () {
          cfg.merge.called.should.not.be.ok;
          done();
        });
    });
  });

  describe( '#_loadConfigFromPackageFile', function () {
    beforeEach( function () {
      this.spellManager.loadFromPath = function () { return util.stream([]); };
      sinon.spy( this.spellManager, 'loadFromPath' );
    });

    it( 'should call loadFromPath with the compiled path', function ( done ) {
      var moduleName = 'spell-browser';
      var expectedPath = path.join( path.resolve( 'node_modules' ), moduleName, 'spells' );
      var spellManager = this.spellManager;

      spellManager._loadSpellsFromPackageFile()(
        util.stream([{
          name: moduleName
        }])
      ).apply( function () {
        spellManager.loadFromPath.calledWithExactly( expectedPath ).should.be.ok;
        done();
      });
    });
  });

  describe( '#loadFromPath', function () {
    it( 'should should save only the modules that export a function', function ( done ) {
      var dir = 'test/spells';
      var spellManager = this.spellManager;

      this.spellManager.loadFromPath( dir )
        .apply( function ( res ) {
          spellManager._spellFns.length.should.be.exactly( 2 );
          done();
        });
    });

    it( 'should should save only the modules that export a function', function ( done ) {
      var dir = 'test/spells';
      var spellManager = this.spellManager;

      this.spellManager.loadFromPath( dir )
        .apply( function ( res ) {
          spellManager._spellFns[0]().should.be.exactly( 1 );
          spellManager._spellFns[1]().should.be.exactly( 2 );
          done();
        });
    });

    describe( 'when the path does not exist', function () {
      it( 'should return empty', function ( done ) {
        var spellManager = this.spellManager;

        this.spellManager.loadFromPath( 'non-existent-path/spells' )
          .apply( function ( res ) {
            res.length.should.be.exactly( 0 );
            done();
          });
      });

      it( 'should emit a warning', function ( done ) {
        var spellManager = this.spellManager;

        this.spellManager.on( 'warn', function ( res ) {
          util.types.isString( res ).should.be.ok;
          done();
        });

        this.spellManager.loadFromPath( 'non-existent-path/spells' ).resume();
      });
    });
  });

  describe( '#loadNpmSpells', function () {
    beforeEach( function () {
      this.spellManager._loadConfigFromPackageFile = function () {
        return util.stream.doto(function () {});
      };

      this.spellManager._loadSpellsFromPackageFile = function () {
        return util.stream.doto(function () {});
      };

      this.spellManager._modulePath = path.resolve( 'test/modules' );
    });

    it( 'should emit a `start_npm` event', function ( done ) {
      this.spellManager.on( 'start_npm', function () {
        done();
      });

      this.spellManager.loadNpmSpells();
    });

    it( 'should filter out non-spells', function ( done ) {
      this.spellManager.loadNpmSpells()
        .apply( function ( res ) {
          res.should.be.exactly( 1 );
          done();
        });
    });

    it( 'should emit `end_npm` on finish', function ( done ) {
      this.spellManager.on( 'end_npm', function ( res ) {
        res.should.be.exactly( 1 );
        done();
      });

      this.spellManager.loadNpmSpells().resume();
    });

    it( 'should emit `error` when a stream throws an error', function ( done ) {
      this.spellManager._loadConfigFromPackageFile = function () {
        return util.stream.consume( function ( err, x, push, next ) {
          push( new Error( 'Oh no!' ) );
          next();
        });
      };

      this.spellManager.on( 'error', function ( res ) {
        done();
      });

      this.spellManager.loadNpmSpells().resume();
    });
  });

  describe( '#runSpells', function () {
    it( 'should run all the spell functions saved', function () {
      var fn1 = sinon.spy();
      var fn2 = sinon.spy();
      this.spellManager._spellFns = [ fn1, fn2 ];
      this.spellManager.runSpells();
      fn1.calledOnce.should.be.true;
      fn2.calledOnce.should.be.true;
    });

    it( 'should pass the spell functions a custom api', function () {
      var fn1 = sinon.spy();
      this.spellManager._spellFns = [ fn1 ];
      this.spellManager.runSpells();
      fn1.firstCall.args[0].should.be.an.object;
    });

    describe( 'spell api', function () {
      var fn1 = sinon.spy();
      beforeEach( function () {
        fn1.reset();
        this.spellManager._spellFns = [ fn1 ];
        this.spellManager.runSpells();
      });

      it( 'should have a reference to the PipelineManager', function () {
        fn1.firstCall.args[0].pipelines.should.be.instanceof( PipelineManager );
      });

      it( 'should have a reference to the ConfigManager', function () {
        fn1.firstCall.args[0].config.should.have.property( 'merge' );
      });

      it( 'should have a reference to the utilities', function () {
        fn1.firstCall.args[0].util.should.have.property( 'stream' );
      });
    });
  });
});

