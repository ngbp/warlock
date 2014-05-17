# Unit tests for warlock

Unit tests will be provided over time for all major warlock functions, with continuous integration
as new commits are added.  Unit tests use mocha and should.js, with all test scripts written in
coffeescript. 


## Running unit tests

To run the unit tests from a newly cloned repository

```sh
npm install -g mocha
npm install
mocha
```


## Writing new unit tests
All newly contributed functions of warlock should have unit tests created.  The warlock team recognise
that most open source developers would prefer to write code than to write tests, so as a general rule
the aim is to provide maximum coverage with the minimum number of test cases, and to provide
test cases that don't require ongoing maintenance when minor changes to the API or logic occur.  This
will allow future contributors to minimise the amount of testing code that needs modification for any
given extension to the logic.

Test cases generally fall into two categories: synchronous cases and asynchronous cases.

Synchronous cases are easier to write.  The general pattern is:

```coffeescript
'use strict'
should = require 'should'
config = require '../lib/warlock/config'

describe 'warlock config: ', -> 
  describe 'config: ', -> 
    it 'add a value to the loaded config, it\'s still there when asked for again', ->
      config( 'blah.four', 'four' ).should.eql 'four'
      config( 'blah.four' ).should.eql 'four'
```

By preference we use eql rather than equal, as this verifies that the content of an object
matches rather than that the instance matches, and is generally good practice.

Describe lines always end with a :, and the outermost describe should provide some indication
of the coffeescript file that is being tested - this is to allow a future developer to quickly 
ascertain where they can find a given test that is failing.

It lines should describe what it is that you're testing and what the expected result is, again
so that a future developer can quickly understand what a failing test was intending to prove.

Asynchronous cases leverage mocha's ability to accept a "done()" callback once asynchronous processing
is complete.  This requires both ( done ) on the 'it' line and an explicit invocation of done() at 
the end of the test case.  

Unfortunately at time of writing there was an outstanding issue with mocha and should where failed 
expectations in an asynchronous test case result in a timeout rather than an error message - refer:
  https://github.com/visionmedia/mocha/pull/278
  https://github.com/visionmedia/mocha/pull/985  

This can be worked around by enclosing the expectations in a try-catch block, with the catch propogating
the exception to the done call.

The basic pattern is therefore:

```coffeescript
describe 'warlock config: ', -> 
  describe 'config: ', -> 
    it 'get values from config that has been loaded', ( done ) ->
      bootstrap._readConfig 'test/fixtures/config/user.json', 'test/fixtures/config/package.json'
      .then ->
        try
          config( 'blah.one' ).should.eql true
  
          done()
        catch err
          done( err )
```

