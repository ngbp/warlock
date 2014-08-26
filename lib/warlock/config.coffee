# node libs
MOUT = require 'mout'
Q = require 'q'
FS = require 'fs'
FINDUP = require 'findup-sync'

# warlock libs
warlock = require './../warlock'

###
# Default warlock options
###
_defaultConfig =
  # Overwriteable glob patterns tasks can reference or use to make flows.
  globs: {}

  # Overwriteable directories build tasks can reference.
  paths: {}

  # Directories to look for plugins
  plugins: []
   
  # Tasks to prevent from running.
  prevent: [ 'something1' ]

  # Tasks to inject into one of the flows.
  inject: []

  # Task aliases - key is the name of the task alias, and the value is a string or array of strings
  aliases: {}

  # The default tasks to run when none are specified.
  default: []

  myval: "Hello!"

###
# The current warlock-wide configuration.
###
_config = {}

###
# The user's config, which would be synced with `warlock.json`
###
_userConfig = {}

config = module.exports = ( key, val, merge ) ->
  if key
    if val
      if merge
        merge = {}
        MOUT.object.set merge, key, val
        config.merge merge
      else
        MOUT.object.set _config, key, val

  return config.get key

###
# Get the user-defined warlock configuration.
###
config.init = ( conf ) ->
  _userConfig = conf
  _config = warlock.util.merge {}, _defaultConfig

###
# Process every property of an object recursively as a template.
# Ripped from Grunt nearly directly.
###
propStringTmplRe = /^<%=\s*([a-z0-9_$]+(?:\.[a-z0-9_$]+)*)\s*%>$/i
config.process = ( raw ) ->
  conf = _getCombinedConfig()
  # recurse will call the given for every non-object, non-array property of the given
  # object, however deep it has to go to do it.
  val = warlock.util.forEveryProperty raw, ( value ) ->
    if not value?
      return value

    # We cannot process a non-string value (e.g. a number or a stream or whatnot) as a template, so
    # just return it.
    if warlock.util.typeOf( value ) isnt 'String'
      return value

    # If possible, access the specified property via config.get, in case it
    # doesn't refer to a string, but instead refers to an object or array.
    matches = value.match /^<%=\s*([a-z0-9_$]+(?:\.[a-z0-9_$]+)*)\s*%>$/i
    if matches
      result = config.get matches[ 1 ]

      # If the result retrieved from the config data wasn't null or undefined,
      # return it.
      if result?
        return result

    # Process the string as a template.
    return warlock.util.template value, conf

###
# Merge a config object into the current configuration.
###
config.merge = ( conf ) ->
  _config = warlock.util.merge _config, conf
  @

config.set = ( key, val ) ->
  MOUT.object.set _config, key, val
  @

config.get = ( key ) ->
  config.process config.getRaw( key )

config.getRaw = ( key ) ->
  if key? then MOUT.object.get( _getCombinedConfig(), key ) else _getCombinedConfig()

###
# The user's configuration, containing only those variables set of manipulated by the user. All of
# these are also in _config, but this is what should be synchronized to warlock.json.
###

config.user = ( key, val, merge ) ->
  if key
    if val
      if merge
        merge = {}
        MOUT.object.set merge, key, val
        config.user.merge merge
      else
        MOUT.object.set _userConfig, key, val

  return config.user.get key

config.user.get = ( key ) ->
  config.process MOUT.object.get( _userConfig, key )

config.user.getRaw = ( key ) ->
  MOUT.object.get _userConfig, key

###
# Merge a config object into the user configuration.
###
config.user.merge = ( conf ) ->
  _userConfig = warlock.util.merge _userConfig, conf

###
# Set a configuration item on the user's configuration.
###
config.user.set = ( key, val ) ->
  MOUT.object.set _userConfig, key, val
  MOUT.object.set _config, key, val

###
# Write the user configuration to file or, if requested, the entire warlock configuration.
###
config.write = ( includeSystem ) ->
  if includeSystem
    conf = _config
  else
    conf = _userConfig

  warlock.util.stringifyJson conf, true
  .then ( json ) ->
    # write to warlock.json
    return warlock.file.writeFile OPTIONS( 'configPath' ), contents
  , ( err ) ->
    LOG.fatal "Could not stringify JSON for config: #{err.toString()}"

_getCombinedConfig = () ->
  warlock.util.merge _config, _userConfig

