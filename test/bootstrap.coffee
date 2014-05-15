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
  
describe 'warlock bootstrap: ', -> 
  describe 'read_config ', -> 
    # these tests focus on the fact that config routines are called, detailed testing of config is in the config module 
    it 'config, empty package.json, loaded correctly', ->
      promise = bootstrap.readConfig 'test/fixtures/bootstrap/user.json', 'test/fixtures/bootstrap/empty.json'

      promise
      .then ->
        config.get( 'standard_values.one' ).should.eql false
        config.get( 'standard_values.extra_1' ).should.eql 1
        config.get( 'standard_values.extra_2' ).should.eql 'fred'


    it 'empty config, package.json, loaded correctly', ->
      promise = bootstrap.readConfig 'test/fixtures/bootstrap/empty.json', 'test/fixtures/bootstrap/package.json'

      promise
      .then ->
        config.get( 'pkg.standard_values.one' ).should.eql true
        config.get( 'pkg.standard_values.two' ).should.eql false
        config.get( 'pkg.standard_values.three' ).should.eql "three"
        config.get( 'pkg.structures.a_hash' ).should.eql { "value_1": "value", "value_2": true, "value_3": 3 }
        config.get( 'pkg.structures.an_array' ).should.eql ["test", 1, true, "john"]

    # TODO(pml): not clear how to test exceptions when asynch - mocha doesn't have great support
    # ideally we'd test a file that cannot parse, a missing file etc
    
    
  describe 'loadPlugins ', ->
    # these tests focus on the fact that load plugins is called, detailed testing of plugins is in the plugin module 
    # TODO(pml): still need to work out what this actually does so as to verify it

  describe 'setDefaultTask', ->
    it 'establishes default tasks', ->
      config.set( 'default', [ 'a_task' ] )
      
      bootstrap.setDefaultTask()
      
      # TODO(pml): this doesn't work
      # warlock.task.getTasks().should.eql( [ 'a_task' ] )
