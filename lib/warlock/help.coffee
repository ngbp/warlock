# Node libs
Table = require 'cli-table'

# warlock
warlock = require '../warlock'

help = module.exports = {}

help.printTaskTable = () ->
  warlock.log.header "Defined Tasks (and Dependencies)\n"

  rows = []
  warlock.task.getTasks().forEach ( task ) ->
    warlock.log.writeln task.name.cyan + ": " + (if task.dep.length then task.dep.join() else "none")
    warlock.log.writeln()


help.printFlowsTable = () ->
  warlock.log.header "Defined Flows\n"

  warlock.flow.all().forEach ( flow ) ->
    # Get the name of the source(s)
    source = flow.getSources()
    if warlock.util.isFunction source
      source = "Function"
    else
      # This could be an array or arrays, so we flatten it and then comma-dilineate it.
      source = source.join ", "

    # Get the name of the dest
    if flow.merge?
      dest = "#{flow.merge.type}::#{flow.merge.target}::#{flow.merge.queue}"
    else
      dest = warlock.config.process flow.options.dest

    # Get the list of streams
    streams = warlock.util.mout.array.pluck( flow.getStreams(), 'name' )
    streams = if streams.length > 0 then streams.join ", " else "none"

    warlock.log.writeln flow.name.underline.bold
    warlock.log.table [
      [ "Source".cyan, source or "none" ]
      [ "Dest".cyan, dest or "none" ]
      [ "Streams".cyan, streams ]
    ]

