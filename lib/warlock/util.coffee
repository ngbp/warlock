# Node modules
EXIT = require 'exit'
FS = require 'fs'
Q = require 'q'
TPL = require 'lodash.template'
GLOB = require 'glob'
ASYNC = require 'async'
MOUT = require 'mout'

# There is a bug that has not been pushed to NPM. https://github.com/nrf110/deepmerge/issues/12
# MERGE = require 'deepmerge'
MERGE = require './../deepmerge'

# warlock
warlock = require './../warlock'

# The exported module.
util = module.exports = {}

# Merge objects deeply.
util.merge = MERGE

# This fixes a Windows problem with truncating output when using process.exit
# See https://github.com/cowboy/node-exit
util.exit = EXIT

# Mout is used all over warlock, so we might as well expose it here.
util.mout = MOUT

# Convenience method for creating deferreds.
util.q = Q
util.defer = Q.defer
util.promise = ( fn ) ->
  deferred = Q.defer()
  fn deferred
  return deferred.promise

# Asynchronous Methods
util.each = ASYNC.each

# Filesystem wrappers
util.readFile = Q.denodeify FS.readFile
util.writeFile = Q.denodeify FS.writeFile
util.pathExists = Q.denodeify FS.exists
util.readFileSync = FS.readFileSync
util.writeFileSync = FS.writeFileSync
util.pathExistsSync = FS.existsSync

# Globbing
util.glob = Q.denodeify GLOB

# JSON
util.parseJsonSync = JSON.parse
util.parseJson = ( string ) ->
  Q.try () ->
    JSON.parse string

util.stringifyJson = ( obj, pretty ) ->
  Q.try () ->
    if pretty then JSON.stringify( obj, null, " " ) else JSON.stringify( obj )

util.stringifyJsonSync = ( obj, pretty ) ->
  if pretty then JSON.stringify( obj, null, " " ) else JSON.stringify( obj )

# Determining variables types
classMap =
  "[object Number]": "Number"
  "[object String]": "String"
  "[object Boolean]": "Boolean"
  "[object Function]": "Function"
  "[object RegExp]": "RegExp"
  "[object Array]": "Array"
  "[object Date]": "Date"
  "[object Error]": "Error"
  "[object Stream]": "Stream"

# Match "[object ___]" where "___" is a [[Class]] value.
classNameRE = /^\[object (.*)\]$/
errorRE = /Error$/

# Return a specific useful value based on a passed object's [[Class]].
# Based on https://github.com/cowboy/javascript-getclass
util.typeOf = ( value ) ->
  if value is null
    return "Null"
  else if not value?
    return "Undefined"

  # Get the "[object [[Class]]]" string for the passed value and pull out the class name.
  key = classMap.toString.call value
  clazz = classNameRE.exec( key )

  if clazz? and clazz.length > 0
    # If it's an error of some kind, just return "Error"
    if errorRE.test( clazz[1] )
      "Error"
    else
      clazz[1]
  else
    # Well, it's an object and that's the best we can do, considering.
    "Object"

util.isA = ( value, type ) ->
  util.typeOf( value ) is type

util.isArray = ( value ) ->
  util.isA value, "Array"
util.isFunction = ( value ) ->
  util.isA value, "Function"
util.isString = ( value ) ->
  util.isA value, "String"
util.isStream = ( value ) ->
  warlock.streams.highland.isStream value

# Execute a function for every non-object property, recursing into objects and arrays.
# This is a direct port of grunt.util.recurse
util.forEveryProperty = ( value, fn, fnContinue ) ->
  if fnContinue and fnContinue( value ) is false
    # Skip value if necessary.
    value
  else if util.isArray value
    # If value is an array, recurse.
    value.map ( value ) ->
      util.forEveryProperty value, fn, fnContinue
  else if util.typeOf( value ) is 'Object'
    # If value is an object, recurse.
    obj = {}
    MOUT.object.forIn value, ( val, key ) ->
      obj[ key ] = util.forEveryProperty val, fn, fnContinue

    obj
  else
    # Otherwise pass value into fn and return.
    fn value

# Process a template relative to the warlock configuration, if needed.
util.template = ( tpl, data ) ->
  last = tpl
  try
    while tpl.indexOf( '<%' ) >= 0
      tpl = TPL tpl, data
      # if nothing changed since last time, there's obviously nothing left to process
      if tpl is last
        break
      last = tpl
  catch err
     warlock.log.fatal "An error occurred while processing a template: #{err.toString()}"

  tpl

