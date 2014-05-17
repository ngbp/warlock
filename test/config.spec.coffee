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
        try
          config( 'blah.one' ).should.eql true
          config( 'blah.two' ).should.eql false
          config( 'blah.three' ).should.eql 'three'
          config( 'blah.an_array' ).should.eql [ 'item_1', 'item_3' ]
          config( 'blah.an_object' ).should.eql { "value_1": 1, "value_2": 'two' }
          config( 'blah' ).should.eql { "one": true, "two": false, "three": "three", "an_array": [ 'item_1', 'item_3' ], "an_object": { "value_1": 1, "value_2": 'two' } }
  
          config( 'pkg.standard_values.one' ).should.eql true
          config( 'pkg.standard_values.two' ).should.eql false
          config( 'pkg.standard_values.three' ).should.eql "three"
          config( 'pkg.structures.a_hash' ).should.eql { "value_1": "value", "value_2": true, "value_3": 3 }
          config( 'pkg.structures.an_array' ).should.eql ["test", 1, true, "john"]
  
          done()
        catch err
          done( err )

    it 'add a value to the loaded config, it\'s still there when asked for again', ( done )->
      bootstrap._readConfig 'test/fixtures/config/user.json', 'test/fixtures/config/package.json'
      .then ->
        try
          config( 'blah.four', 'four' ).should.eql 'four'
          config( 'blah.four' ).should.eql 'four'

          done()
        catch err
          done( err )

    it 'override an array value in the loaded config, it\'s still there when asked for again', ( done )->
      bootstrap._readConfig 'test/fixtures/config/user.json', 'test/fixtures/config/package.json'
      .then ->
        try
          config( 'blah.an_array', 'item_2', false ).should.eql 'item_2'
          config( 'blah.an_array' ).should.eql 'item_2'

          done()
        catch err
          done( err )

    it 'use merge to add a value to an array in the loaded config, values have been persisted into the config', ( done )->
      bootstrap._readConfig 'test/fixtures/config/user.json', 'test/fixtures/config/package.json'
      .then ->
        try
          config( 'blah.an_array', 'item_2', true ).should.eql [ 'item_2', 'item_1', 'item_3' ]
          config( 'blah.an_array' ).should.eql [ 'item_2', 'item_1', 'item_3' ]
          
          done()
        catch err
          done( err )

    it 'override an object value in the loaded config, it\'s still there when asked for again', ( done )->
      bootstrap._readConfig 'test/fixtures/config/user.json', 'test/fixtures/config/package.json'
      .then ->
        try
          config( 'blah.an_object', { 'value_3': 'three' }, false ).should.eql { value_3: 'three' }
          config( 'blah.an_object' ).should.eql { value_3: 'three' }

          done()
        catch err
          done( err )

    it 'use merge to add a value to an object in the loaded config, values have been persisted into the config', ( done )->
      bootstrap._readConfig 'test/fixtures/config/user.json', 'test/fixtures/config/package.json'
      .then ->
        try
          config( 'blah.an_object', { 'value_3': 'three' }, true ).should.eql { value_1: 1, value_2: 'two', value_3: 'three' }
          config( 'blah.an_object' ).should.eql { value_1: 1, value_2: 'two', value_3: 'three' }
          
          done()
        catch err
          done( err )
