# node libraries
Orchestrator = require 'orchestrator'

# warlock libs
warlock = require './../warlock'

# The default tasks to run
defaultTasks = [ 'default' ]

class Tasks extends Orchestrator

Tasks::engage = ( t ) ->
  tasks = t ? []

  if not tasks? or tasks.length is 0
    tasks = defaultTasks

  tasks.forEach ( task ) =>
    if not @hasTask task
      warlock.fatal "Unknown task: #{task}"

  if tasks.length is 0
    warlock.log.log "There are no tasks to run."
    warlock.util.Q true
  else
    warlock.util.promise ( deferred ) =>
      warlock.log.subheader "Starting tasks: " + tasks.join " "
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

