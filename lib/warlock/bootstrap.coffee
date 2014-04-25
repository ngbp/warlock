# Node libraries
Q = require 'q'
FINDUP = require 'findup-sync'
PATH = require 'path'

# ngbo libraries
warlock = require './../warlock'

module.exports = ( options ) ->
  warlock.debug.log "Bootstrapping warlock..."
  # Store the options provided for system-wide access
  warlock.options.init options

  # Locate the configuration file and save its path for later use
  configPath = FINDUP warlock.options( 'configPath' ), { cwd: process.cwd() }
  promise = warlock.util.q "{}"
  if not configPath?
    warlock.log.warning "No config file found. Using empty configuration instead."
  else
    warlock.debug.log "Config found: #{configPath}"
    promise = warlock.file.readFile( configPath )

  promise
  .then ( file ) ->
    # Save the config file location for later use
    warlock.options 'configFile', configPath || 'warlock.json'
    warlock.options 'projectPath', PATH.dirname( configPath )

    # Parse its contents
    warlock.util.parseJson file
  , ( err ) ->
    warlock.fatal "Could not read config file: #{err.toString()}."
  .then ( config ) ->
    warlock.debug.log "Config loaded."
    # Load the config into warlock
    warlock.config.init config

    # Read in the package.json. It's required.
    pkgPath = FINDUP "package.json", { cwd: process.cwd() }
    warlock.file.readFile( pkgPath )
  , ( err ) ->
    warlock.fatal "Could not parse config file: #{err.toString()}"
  .then ( file ) ->
    warlock.debug.log "package.json read from disk."
    warlock.util.parseJson file
  , ( err ) ->
    warlock.fatal "Could not load package.json: #{err.toString()}"
  .then ( pkg ) ->
    warlock.debug.log "package.json loaded to `pkg`."
    warlock.config "pkg", pkg

    # Load all the plugins
    warlock.plugins.load()
  , ( err ) ->
    warlock.fatal "Could not parse package.json: #{err.toString()}"
  .then () ->
    flows = warlock.flow.all()

    # Flow tasks are tasks that represent single flows.
    flowTasks = {}

    # The meta-tasks are automatically generated based on the configuration of flows.
    metaTasks = warlock.flow.getMetaTasks()

    # Gather up the list of flow tasks.
    flows.forEach ( flow ) ->
      taskName = flow.getTaskName()
      flowTasks[taskName] = flow.getDependencies()

    # Now loop through the flows again and add their reverse dependencies (e.g. for a merge). Also,
    # create the flow tasks and gather the data necessary to create meta tasks for every flow task.
    flows.forEach ( flow ) ->
      taskName = flow.getTaskName()

      flow.priorTo.forEach ( task ) ->
        # FIXME(jdm): There should be a way for this to return an error.
        depName = warlock.flow( task ).getTaskName()
        if not flowTasks[depName]?
          warlock.fatal "Unknown task when adding reverse dependency for #{flow.name} - #{depName}"

        flowTasks[depName].push taskName

    # Now create the actual flow-tasks from the information we've collected.
    flows.forEach ( flow ) ->
      taskName = flow.getTaskName()
      deps = flowTasks[taskName]
      warlock.task.add taskName, deps, () ->
        flow.run()

    # Now create the meta-tasks with the flow tasks as dependent tasks.
    warlock.util.mout.object.forOwn metaTasks, ( deps, task ) ->
      warlock.task.add task, deps

    warlock.util.q true
  .then () ->
    # Ensure we have a default task defined, if none has been specified elsewhere
    tasks = warlock.config( "default" )
    if tasks? and tasks?.length
      warlock.task.add "default", tasks
    else
      warlock.log.warning "There is no default task defined. This is usually handed by plugins or spells."

    warlock.util.q true

