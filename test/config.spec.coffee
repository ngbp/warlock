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
  config.init( {} )
  
describe 'warlock config: ', -> 
  describe 'config: ', -> 
    it 'get values from config that has been loaded', ( done ) ->
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

    it 'add a value to the loaded config, it\'s still there when asked for again', ->
      config( 'blah.four', 'four' ).should.eql 'four'
      config( 'blah.four' ).should.eql 'four'

    it 'add an an array value then override it, it\'s still there when asked for again', ->
      config( 'blah.a_new_array', [ 'item_1', 'item_3' ], false ).should.eql [ 'item_1', 'item_3' ]
      config( 'blah.a_new_array', [ 'item_2' ], false ).should.eql [ 'item_2' ]
      config( 'blah.a_new_array' ).should.eql [ 'item_2' ]

    it 'use merge to add a value to an array, values have been persisted into the config', ->
      config( 'blah.a_new_array', [ 'item_1', 'item_3' ], false ).should.eql [ 'item_1', 'item_3' ]
      config( 'blah.a_new_array', [ 'item_2' ], true ).should.eql [ 'item_1', 'item_3', 'item_2' ]
      config( 'blah.a_new_array' ).should.eql [ 'item_1', 'item_3', 'item_2' ]

    it 'add an object then override it, it\'s still there when asked for again', ->
      config( 'blah.a_new_object', { value_1: 1, value_2: 'two',  }, false ).should.eql { value_1: 1, value_2: 'two',  }
      config( 'blah.a_new_object', { 'value_3': 'three' }, false ).should.eql { value_3: 'three' }
      config( 'blah.a_new_object' ).should.eql { value_3: 'three' }

    it 'use merge to add a value to an object in the loaded config, values have been persisted into the config', ->
      config( 'blah.a_new_object', { value_1: 1, value_2: 'two',  }, false ).should.eql { value_1: 1, value_2: 'two',  }
      config( 'blah.a_new_object', { 'value_3': 'three' }, true ).should.eql { value_1: 1, value_2: 'two', value_3: 'three' }
      config( 'blah.a_new_object' ).should.eql { value_1: 1, value_2: 'two', value_3: 'three' }


  describe 'config.init: ', -> 
    it 'init works', ->
      # this test will need updating whenever the default structure is changed
      conf = { value_1: 'one' }
      config.init( conf )
      config.getRaw().should.eql {
        globs: {}
        paths: {}
        plugins: []
        prevent: []
        inject: []
        default: []
        value_1: 'one'         
      }
      
  describe 'config.process: ', -> 
    it 'an object with no templates returns that same object', ->
      obj = { 
        value_1: 'one'
        value_2: 1,
        value_3: false,
        array: [ 'two', 2, true, { item: 'item_value' } ],
        object: { attr1: 'attr', attr2: [ 1, 2, 3, 'string' ], attr3: false } 
      }
      
      config.process( obj ).should.eql( obj )
      
    it 'an object with a template returns that same object with the template value replaced', ->
      test_obj = { 
        value_1: '<%= blah.three %>'
        value_2: 1,
        value_3: false,
        array: [ 'two', 2, true, { item: 'item_value' } ],
        object: { attr1: 'attr', attr2: [ 1, 2, 3, 'string' ], attr3: false } 
      }

      result_obj = { 
        value_1: 'three'
        value_2: 1,
        value_3: false,
        array: [ 'two', 2, true, { item: 'item_value' } ],
        object: { attr1: 'attr', attr2: [ 1, 2, 3, 'string' ], attr3: false } 
      }
      
      config( 'blah.three', 'three' )
      config.process( test_obj ).should.eql( result_obj )

    it 'mix of template values, including some that refer to arrays and objects', ->
      test_obj = { 
        value_1: '<%= blah.three %>'
        value_2: 1,
        value_3: false,
        array: [ 'two', 2, true, { item: '<%= blah.two %>' } ],
        object: { attr1: 'attr', attr2: [ 1, 2, 3, '<%= blah.one %>' ], attr3: false } 
      }

      result_obj = { 
        value_1: 'three'
        value_2: 1,
        value_3: false,
        array: [ 'two', 2, true, { item: { a: 'a', b: 'b', c: false } } ],
        object: { attr1: 'attr', attr2: [ 1, 2, 3, [ 1, 2, 3 ] ], attr3: false } 
      }
      
      config( 'blah.one', [ 1, 2, 3 ] )
      config( 'blah.two', { a: 'a', b: 'b', c: false } )
      config( 'blah.three', 'three' )
      
      config.process( test_obj ).should.eql( result_obj )
      
  # PML: merge, set, get and getRaw are implicitly tested in the earlier tests, and
  # have no complex logic.  In the interests of maintainability, not explicitly tested
  # here.

  describe 'config: ', -> 
    it 'get values from config that has been loaded', ( done ) ->
      bootstrap._readConfig 'test/fixtures/config/user.json', 'test/fixtures/config/package.json'
      .then ->
        try
          config.user( 'blah.one' ).should.eql true
          config.user( 'blah.two' ).should.eql false
          config.user( 'blah.three' ).should.eql 'three'
          config.user( 'blah.an_array' ).should.eql [ 'item_1', 'item_3' ]
          config.user( 'blah.an_object' ).should.eql { "value_1": 1, "value_2": 'two' }
          config.user( 'blah' ).should.eql { "one": true, "two": false, "three": "three", "an_array": [ 'item_1', 'item_3' ], "an_object": { "value_1": 1, "value_2": 'two' } }
  
          # without merge - all
          config.user( 'blah.an_array', 'item_2' ).should.eql 'item_2'
          config.user( 'blah.an_array' ).should.eql 'item_2'
  
          # with merge
          config.user( 'blah.an_object', { "value_4": 4 }, true ).should.eql { "value_1": 1, "value_2": 'two', "value_4": 4 }
          config.user( 'blah.an_object' ).should.eql { "value_1": 1, "value_2": 'two', "value_4": 4 }

          done()
        catch err
          done( err )
          
    it 'add a value to the loaded config, it\'s still there when asked for again', ->
      config.user( 'blah.four', 'four' ).should.eql 'four'
      config.user( 'blah.four' ).should.eql 'four'

    it 'add an an array value then override it, it\'s still there when asked for again', ->
      config.user( 'blah.a_new_array', [ 'item_1', 'item_3' ], false ).should.eql [ 'item_1', 'item_3' ]
      config.user( 'blah.a_new_array', [ 'item_2' ], false ).should.eql [ 'item_2' ]
      config.user( 'blah.a_new_array' ).should.eql [ 'item_2' ]

    it 'use merge to add a value to an array, values have been persisted into the config', ->
      config.user( 'blah.a_new_array', [ 'item_1', 'item_3' ], false ).should.eql [ 'item_1', 'item_3' ]
      config.user( 'blah.a_new_array', [ 'item_2' ], true ).should.eql [ 'item_1', 'item_3', 'item_2' ]
      config.user( 'blah.a_new_array' ).should.eql [ 'item_1', 'item_3', 'item_2' ]

    it 'add an object then override it, it\'s still there when asked for again', ->
      config.user( 'blah.a_new_object', { value_1: 1, value_2: 'two',  }, false ).should.eql { value_1: 1, value_2: 'two',  }
      config.user( 'blah.a_new_object', { 'value_3': 'three' }, false ).should.eql { value_3: 'three' }
      config.user( 'blah.a_new_object' ).should.eql { value_3: 'three' }

    it 'use merge to add a value to an object in the loaded config, values have been persisted into the config', ->
      config.user( 'blah.a_new_object', { value_1: 1, value_2: 'two',  }, false ).should.eql { value_1: 1, value_2: 'two',  }
      config.user( 'blah.a_new_object', { 'value_3': 'three' }, true ).should.eql { value_1: 1, value_2: 'two', value_3: 'three' }
      config.user( 'blah.a_new_object' ).should.eql { value_1: 1, value_2: 'two', value_3: 'three' }

  # PML: merge, set, get and getRaw are implicitly tested in the earlier tests, and
  # have no complex logic.  In the interests of maintainability, not explicitly tested
  # here.
     

  describe 'config.write: ', -> 
    # TODO(pml): didn't feel like dealing with file handling today

      
