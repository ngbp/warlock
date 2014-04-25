# The module to be exported.
warlock = module.exports = {}

# Get the version number
warlock.version = require( './../package.json' ).version

# Expose internal warlock libs.
wRequire = ( name ) ->
  warlock[ name ] = require './warlock/' + name

# Expose module functions globally.
wExpose = ( o, fn, newFn ) ->
  if warlock.util.typeOf( o[ fn ] ) is 'Function'
    warlock[ newFn or fn ] = o[ fn ].bind o
  else
    warlock[ newFn or fn ] = o[ fn ]

# Export some warlock libs.
# TODO(jdm): Port these from the old PoC
#wRequire 'scaffold'
#wRequire 'bower'

# Gruntless, Good to Go
wRequire 'task'
wRequire 'help'
wRequire 'util'
wRequire 'plugins'
wRequire 'config'
wRequire 'cli'
wRequire 'log'
wRequire 'options'
wRequire 'flow'
wRequire 'bootstrap'
wRequire 'file'
wRequire 'streams'

# Expose some methods from the included libs directly under the warlock namespace.
wExpose warlock.task, 'engage'
wExpose warlock.task, 'watch'
wExpose warlock.log, 'verbose'
wExpose warlock.log, 'debug'
wExpose warlock.log, 'fatal'
wExpose warlock.config, 'user', 'userConfig'

