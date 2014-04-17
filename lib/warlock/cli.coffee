# Node libraries
NOMNOM = require 'nomnom'
PKG = require './../../package.json'
UTIL = require 'util'

# warlock libraries
warlock = require './../warlock'

# Process the command-line options.
options = NOMNOM
.script( 'warlock' )
.option 'todo',
  list: true
  help: 'The tasks you wish to run. Defaults to \'default\'.'
  position: 0
.option 'help',
  abbr: 'h'
  help: 'Display this help text.'
  flag: true
.option 'version',
  abbr: 'V'
  help: 'Print the warlock version.'
  flag: true
  callback: () ->
    # TODO(jdm): print available tasks for completion scripts
    "warlock v#{PKG.version}"
.option 'verbose',
  abbr: 'v'
  help: 'Verbose mode. A lot more helprmation output.'
  flag: true
.option 'debug',
  abbr: 'd'
  help: 'Enable debugging mode for tasks that support it.'
  flag: true
.option 'stack',
  help: 'Print a stack trace when exiting with a warning or fatal error.'
  flag: true
.option 'flows',
  abbr: 'f'
  help: 'Print out the list of defined flows.'
  flag: true
.option 'tasks',
  help: 'Print out the list of available tasks.'
  flag: true
.option 'configPath',
  abbr: 'c'
  help: 'The JSON configuration file to use. Defaults to `warlock.json` and will find upward.'
  default: 'warlock.json'
  full: 'config'
.option 'plugins',
  help: 'Load plugins from the specified directory.'
  list: true
.option 'conf',
  help: 'Get a configuration value.'
.option 'set',
  abbr: 's'
  help: 'Set or change a configuration value. Must be used with --get. Use --write to save to warlock.json.'
.option 'prevent',
  abbr: 'p'
  help: 'Prevent a flow step/stream from running. Can be specified multiple times. Use --write to ' +
    'save to warlock.json.'
  list: true
.option 'allow',
  abbr: 'a'
  help: 'Allow a flow step/stream to run, overwriting whether they are prevented already. Can be ' +
    'specified multiple times. Use --write to save to warlock.json, if necessary.'
  list: true
.option 'inject',
  abbr: 'i'
  help: 'Inject a task into the build process using the format task@hook#priority. E.g. ' +
    '"mytask:subtask@prebuild#20". This option can be repeated to inject multiple tasks. Use ' +
    '--write to save to warlock.json.'
  list: true
.option 'injectWatch',
  help: 'Inject a task into the watch process using the format task@glob#priority. E.g. ' +
    '"mytask:subtask@app.js#20". This option can be repeated to inject multiple tasks. Use ' +
    '--write to save to warlock.json.'
  full: 'inject-watch'
  list: true
.option 'write',
  abbr: 'w'
  help: 'Write any configuration changes to `warlock.json`, such as task preventions.'
  flag: true
.option 'raw',
  help: 'When printing configuration values, do not process them as templates first. This will ' +
    'show the values as they were defined, rather than how they will appear during runtime.'
  flag: true
.option 'user',
  abbr: 'u'
  help: 'Restrict configuration commands to your local warlock configuration (warlock.json).'
  flag: true
.option 'coffee',
  help: 'When creating a new warlock app, scaffold the Gruntfile in CoffeeScript instead of JavaScript.'
  flag: true
.option 'appName',
  help: 'When creating a new warlock app, the name of the app to create.'
  full: 'app-name'
.option 'appVersion',
  help: 'When creating a new warlock app, the version of the app to create.'
  full: 'app-version'
.option 'appAuthor',
  help: 'When creating a new warlock app, the author of the app to create.'
  full: 'app-author'
.parse()

###
# Start the CLI, people!
###
cli = () ->
  runDefaultTasks = true

  # TODO(jdm): check if we need to init

  # With any of these options, we needn't necessarily run the default tasks.
  if options.flows or options.tasks or options.write
    runDefaultTasks = false

  # If the user is getting a value - but not setting it - we needn't necessarily run the default
  # task.
  if options.conf and ! options.set
    runDefaultTasks = false

  # Tasks were specified, we don't need to run the default ones either
  if options.todo?.length > 0
    runDefaultTasks = false

  warlock.bootstrap( options )
  .then () ->
    ###
    # Handle the command line options
    ###

    # Add any CLI-prevented tasks to the config.
    # TODO(jdm): we should be able to also prevent and allow whole tasks and plugins
    if options.prevent?
      tasks = options.prevent.map ( t ) -> t.trim()
      warlock.config.user 'prevent', tasks, true

    # Add any CLI-allowed tasks to the config.
    if options.allow?
      tasks = options.allow.map ( t ) -> t.trim()
      warlock.config.user 'allow', tasks, true

    # TODO(jdm): process plugins

    # If requested, set a config value temporarily.
    if options.set?
      warlock.log.warning "--set requires --conf to specify a key." if not options.conf?
      warlock.config.user.set options.conf, options.set

    # If requested, print out a configuration value.
    # TODO(jdm): support JSON for merging
    if options.conf?
      method = if options.raw? then 'getRaw' else 'get'
      obj = if options.user? then warlock.config.user else warlock.config
      option = UTIL.inspect obj[method]( options.conf ),
        colors: true
      warlock.log.writeln "\n#{options.conf} = #{option}"

    # TODO(jdm): process inject
    # if options.inject
    #   options.inject.forEach ( task ) ->
    #     TASK.inject UTIL.parseTaskString( task )

    # TODO(jdm): process injectWatch
    # if options.injectWatch
    #   options.injectWatch.forEach ( task ) ->
    #     TASK.inject UTIL.parseTaskString( task, true )

    # Print out a task list, if requested.
    if options.tasks?
      warlock.help.printTaskTable()

    # Print out a flows list, if requested.
    if options.flows?
      warlock.help.printFlowsTable()

    # Number One, make it so!
    if runDefaultTasks or options.todo?.length > 0
      warlock.engage options.todo
  .catch ( err ) ->
    warlock.fatal err

# Our only export is the cli function
module.exports = cli


