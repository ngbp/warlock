# node libraries
Orchestrator = require 'orchestrator'

# warlock libs
warlock = require './../warlock'

# The default tasks to run
defaultTasks = [ 'default' ]

class Tasks extends Orchestrator

Tasks::engage = ( tasks ) ->
  tasks ?= []
  tasks = [ tasks ] if warlock.util.isString tasks

  if not warlock.util.isArray tasks
    warlock.fatal "Task::watch takes a task name or array of task names."

  if tasks.length is 0
    tasks = defaultTasks

  tasks.forEach ( task ) =>
    if not @hasTask task
      warlock.fatal "Unknown task: #{task}"

  if tasks.length is 0
    warlock.log.log "There are no tasks to run."
    warlock.util.Q true
  else
    warlock.util.promise ( deferred ) =>
      warlock.log.subheader "Starting tasks: " + tasks.join ", "
      start = process.hrtime()

      # The last argument is a callback.
      tasks.push () ->
        elapsed = process.hrtime( start )
        s = elapsed[0]
        ms = elapsed[1] / 1000000
        warlock.log.subheader "Completed tasks in #{s}s #{ms.toFixed(0)}ms."

      @on "err", ( e ) ->
        deferred.reject e.err
      @on "stop", () ->
        deferred.resolve arguments
      @on "start", ( e ) ->
        taskList = e.message.split( ": " )
        taskList.splice( 0, 1 )
        taskList = taskList[0].split( "," ).join( ", " )
        warlock.verbose.log "Queued tasks: #{taskList}"
      @on "task_start", ( e ) ->
        warlock.log.log "Starting task: #{e.task}"

      @start.apply( @, tasks )

Tasks::watch = ( tasks ) ->
  tasks ?= []
  tasks = [ tasks ] if warlock.util.isString tasks

  if not warlock.util.isArray tasks
    warlock.fatal "Task::watch takes a task name or array of task names."

  if tasks.length is 0
    tasks = defaultTasks

  tasks.forEach ( task ) =>
    if not @hasTask task
      warlock.fatal "Unknown task: #{task}"

  if tasks.length is 0
    warlock.log.log "There are no tasks to run."
    warlock.util.Q true
  else
    warlock.util.promise ( deferred ) =>
      flowsToWatch = []
      watches = []
      metaTasks = warlock.flow.getMetaTasks()

      # When the user exits out, close all the watchers so we can exit gracefully.
      # FIXME(jdm): this isn't always from the CLI, so this should be moved there.
      process.on 'SIGINT', () ->
        warlock.log.subheader "Watch completed successfully."
        watches.forEach ( watcher ) -> watcher.close()
        deferred.resolve true

      # Get all tasks of the provided tasks, including dependencies
      # FIXME(jdm): should only be for the PROVIDED tasks
      allTasks = @getTasks()

      # For each task, get the flows from the metaTasks
      allTasks.forEach ( task ) ->
        flows = metaTasks[ task.name ] or []
        flows.forEach ( taskName ) ->
          flow = warlock.flow.getFromTaskName taskName
          if flow?.shouldBeWatched()
            flowsToWatch.push( flow )

      warlock.log.subheader "Watching flows: " + flowsToWatch.map( (f) -> f.name ).join ", "

      # Now start watching them all.
      flowsToWatch.forEach ( flow ) =>
        sources = flow.getSources()
        watcher = new warlock.file.Watcher sources

        watcher.on 'ready', () ->
          warlock.verbose.log "Started watching #{flow.name}: #{sources}"
        watcher.on 'err', ( err ) ->
          warlock.verbose.or.error "Error watching #{flow.name}"
          warlock.log.error err
        watcher.on 'changed', ( filepath ) =>
          warlock.log.log "File changed in #{flow.name}: #{filepath}."

          # We must manually add the reverse dependencies (e.g. for a merge).
          tasks = flow.priorTo.map ( f ) -> warlock.flow( f ).getTaskName()
          tasks.unshift flow.getTaskName()
          @engage tasks
        watcher.on 'nomatch', () ->
          warlock.verbose.log "No files to watch in #{flow.name}."

        watches.push watcher

Tasks::getTasks = () ->
  tasks = warlock.util.mout.object.values @tasks

  # For each task, sort the dependencies
  tasks.forEach ( task ) =>
    deps = []
    try
      @sequence @tasks, task.dep, deps
      task.dep = deps
    catch err
      if err?
        if err.missingTask?
          # TODO: we should hook into the events, rather than reporting directly.
          warlock.log.fatal "Unknown task: #{err.missingTask}"
          @.emit "task_not_found",
            message: err.message
            task:err.missingTask
            err: err
        if err.recursiveTasks?
          warlock.log.fatal "Recursive tasks: #{err.recursiveTasks}"
          @.emit "task_recursion",
            message: err.message
            recursiveTasks:err.recursiveTasks
            err: err

  tasks

Tasks::addCleanTask = ( name, target ) ->
  taskName = "clean::#{name}"
  @add taskName, () ->
    warlock.verbose.log "[#{name}] Cleaning #{target}"
    warlock.file.rimraf target
  taskName

Tasks::isPrevented = ( task ) ->
  allowed = false
  allow = warlock.config.get( "allow" ) or []
  allow.forEach ( t ) ->
    allowed = true if task is t

  return false if allowed

  prevented = false
  prevent = warlock.config.get( "prevent" ) or []
  prevent.forEach ( t ) ->
    prevented = true if task is t

  if prevented then true else false

module.exports = new Tasks()

