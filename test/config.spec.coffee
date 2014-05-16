'use strict'
should = require 'should'
join = ( require 'path' ).join
options = require '../lib/warlock/options'
warlock = require '../lib/warlock'
bootstrap = require '../lib/warlock/bootstrap'
config = require '../lib/warlock/config'

require 'mocha'

beforeEach ->
  options.init { 'debug': false }
  
describe 'warlock config: ', -> 
  describe 'config base export: ', -> 
    # these tests focus on the fact that config routines are called, detailed testing of config is in the config module 
    it 'get values from config that has been loaded', ( done )->
      bootstrap._readConfig 'test/fixtures/config/user.json', 'test/fixtures/config/package.json'
      .then ->
        config( 'blah.one' ).should.eql true
        config( 'blah.two' ).should.eql false
        config( 'blah.three' ).should.eql 'three'
        config( 'blah' ).should.eql { "one": true, "two": false, "three": "three" }

        config( 'pkg.standard_values.one' ).should.eql true
        config( 'pkg.standard_values.two' ).should.eql false
        config( 'pkg.standard_values.three' ).should.eql "three"
        config( 'pkg.structures.a_hash' ).should.eql { "value_1": "value", "value_2": true, "value_3": 3 }
        config( 'pkg.structures.an_array' ).should.eql ["test", 1, true, "john"]

        done()

    it 'add a value to the loaded config, it\'s still there when asked for again', ( done )->
      bootstrap._readConfig 'test/fixtures/config/user.json', 'test/fixtures/config/package.json'
      .then ->
        config( 'blah.four', 'four' ).should.eql 'four'
        config( 'blah.four' ).should.eql 'four'

        done()

    it 'use merge to add a value to the loaded config, values have been persisted into the config', ( done )->
      bootstrap._readConfig 'test/fixtures/config/user.json', 'test/fixtures/config/package.json'
      .then ->
        config( 'blah.four', 'four', true ).should.eql 'four'
        config( 'blah.four' ).should.eql 'four'
        
        done()


