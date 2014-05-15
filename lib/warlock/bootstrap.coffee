# Node libraries
Q = require 'q'
FINDUP = require 'findup-sync'
PATH = require 'path'

# ngbo libraries
warlock = require './../warlock'


bootstrap = module.exports = ( options ) ->
  warlock.debug.log "Bootstrapping warlock..."
  # Store the options provided for system-wide access
  warlock.options.init options
  
  configPath = FINDUP warlock.options( 'configPath' ), { cwd: process.cwd() }
  pkgPath = FINDUP "package.json", { cwd: process.cwd() }
  
  promise = warlock.util.q "{}"
  bootstrap.readConfig configPath, pkgPath, promise
  
  promise
  .then () ->
    bootstrap.loadPlugins
  .then () -> 
    bootstrap.setDefaultTask

  warlock.util.q true



###
# Find the warlock configuration and package.json, using defaults as necessary,
# read them in, and initialise the configuration using them
###
bootstrap.readConfig = ( configPath, pkgPath, promise ) ->
  # Locate the configuration file and save its path for later use
  if not configPath?
    warlock.log.warning "No config file found. Using empty configuration instead."
  else
    warlock.debug.log "Config found: #{configPath}"
    promise = warlock.file.readFile( configPath )

  return promise
  .then ( file ) ->
    # Save the config file location for later use
    warlock.options 'configFile', configPath || 'warlock.json'
    
    # TODO (pml): is it always true that the projectPath is the dir part of configPath?
    warlock.options 'projectPath', PATH.dirname( configPath )

    # Parse its contents
    warlock.util.parseJson file
  , ( err ) ->
    warlock.fatal "Could not read config file: #{err.toString()}."
  .then ( config ) ->
    warlock.debug.log "Config loaded, content was:\n" + JSON.stringify( config )
    # Load the config into warlock
    warlock.config.init config

    # Read in the package.json. It's required.
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
  , ( err ) ->
    warlock.fatal "Could not parse package.json: #{err.toString()}"



###
# Load all plugins
###
bootstrap.loadPlugins = () -> 
  # Load all the plugins
  warlock.debug.log "commencing loading plugins"

  warlock.plugins.load()
  .then () ->
    warlock.flow.validate()
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

    warlock.debug.log "plugins loaded"
    
    warlock.util.q true


bootstrap.setDefaultTask = () ->
  # Set the default task(s)
  tasks = warlock.config( "default" )
  
  if tasks? and tasks?.length
    warlock.task.add "default", tasks
  else
    warlock.log.warning "There is no default task defined. This is usually handed by plugins or spells."


