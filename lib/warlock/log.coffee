# node modules
COLORS = require 'colors'
MOUT = require 'mout'
Table = require 'cli-table'

# warlock libraries
OPTIONS = require './options'
UTIL = require './util'

# Whether or not to prefix the log messages with "[warlock] "
prefix = false

# The log module
log = module.exports = {}

# Objects that hold convenience methods for logging only under certain conditions.
log.verbose = {}
log.debug = {}
log.notverbose = {}

# A way to switch between verbose and notverbose modes. For example, this will
# write 'foo' if verbose logging is enabled, otherwise write 'bar':
# verbose.write('foo').or.write('bar')
log.verbose.or = log.notverbose
log.notverbose.or = log.verbose

# TODO(jdm): include timestamp
wrap = ( text, newline ) ->
  msg = ""
  msg += "\n" if newline
  msg += "[warlock] " if prefix
  msg += text or ""
  msg

log.error = ( error, code ) ->
  oldPrefix = prefix
  prefix = true
  output = ( msg ) -> console.log wrap( msg ).red

  if not error?
    output "Unknown error."
  else if UTIL.typeOf( error ) is 'Error'
    output error.toString()

    if error.stack? and ( OPTIONS( 'stack' ) or OPTIONS( 'debug' ) )
      console.error error.stack
  else
    output error

  prefix = oldPrefix

log.fatal = ( error, code ) ->
  log.error error, code

  # TODO(jdm): Should support more sophisticated and standard error codes
  UTIL.exit code || 1

log.warning = ( msg ) ->
  console.log wrap( msg ).yellow

log.header = ( msg ) ->
  console.log wrap( msg, true ).bold.underline.cyan

log.subheader = ( msg ) ->
  console.log wrap( msg, true ).bold.magenta

log.success = ( msg ) ->
  console.log wrap( msg ).bold.green

log.log = ( msg ) ->
  console.log wrap( msg )

log.writeln = ( msg ) ->
  console.log msg || ""

log.disablePrefix = () ->
  prefix = false

log.enablePrefix = () ->
  prefix = true

log.table = ( rows, opts ) ->
  options = UTIL.mout.object.merge
    chars:
      'top': ''
      'top-mid': ''
      'top-left': ''
      'top-right': ''
      'bottom': ''
      'bottom-mid': ''
      'bottom-left': ''
      'bottom-right': ''
      'left': ''
      'left-mid': ''
      'mid': ''
      'mid-mid': ''
      'right': ''
      'right-mid': ''
      'middle': ''
    style:
      compact: true
      'padding-left': 0
      'padding-right': 1
  , opts or {}

  table = new Table options
  rows.forEach ( row ) ->
    table.push row
  log.writeln table.toString()

# Create verbose versions of the log functions.
# Concept totally ripped from Grunt.
MOUT.object.forOwn log, ( val, key ) ->
  if UTIL.typeOf( val ) is 'Function'
    log.debug[ key ] = () ->
      if OPTIONS 'debug'
        val.apply log, arguments
      log.debug

    log.verbose[ key ] = () ->
      if OPTIONS 'verbose'
        val.apply log, arguments
      log.verbose

    log.notverbose[ key ] = () ->
      if not OPTIONS 'verbose'
        val.apply log, arguments
      log.notverbose

