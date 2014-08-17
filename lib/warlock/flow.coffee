# Node libraries
MOUT = require 'mout'

# warlock
warlock = require './../warlock'

# Flows currently registered.
flows = {}

# Tasks during which flows would like to run.
definedTasks = []

# Priority range
minPriority = 1
maxPriority = 100

# A cache of the list of meta tasks.
metaTaskCache = undefined

##
# Represents a flow that passes a source through a series of streams. The heart of warlock.
##
class Flow
  constructor: ( @name, options ) ->
    # Set up some instance variables we'll need later on.
    @steps = []
    @usedPriorities = []
    @priorTo = []

    # Create pre- and post-queues for task injection.
    @queues =
      pre: []
      post: []

    @setOptions options

Flow::setOptions = ( options ) ->
  return @ if not options?

  @options = warlock.util.merge @options or {}, options

  # Set the array of tasks during which this flow needs to run.
  @_tasks = @_tasks or @options.tasks or []
  @_tasks = [ @_tasks ] if warlock.util.typeOf( @_tasks ) isnt 'Array'

  # Load up the passed-in dependencies, if necessary.
  if warlock.util.isString @options.depends
    @options.depends = [ @options.depends ]

Flow::validate = () ->
  # Ensure the source is valid.
  if not @options.source?
    throw new Error "Flow '#{@name}' has no source. It can't do anything if it starts with nothing."

  if warlock.util.isString @options.source
    @options.source = [ @options.source ]

  if not warlock.util.isFunction( @options.source ) and not warlock.util.isArray( @options.source )
    throw new Error "Flow '#{@name}' has an invalid source. It must be a string path, an array " +
      "of string paths, or a function that returns a stream."

  if not warlock.util.isFunction( @options.source ) and not warlock.util.isArray( @options.source )
    throw new Error "Invalid source for flow '#{@name}'; expected String, Array, or Function."

  # Ensure the destination is valid.
  if @options.dest and not warlock.util.isString @options.dest
    throw new Error "Flow '#{@name}' has an invalid destination. It must be a string path."

  # Pre-process the merge directive.
  if @options.merge?
    mergeFmtRe = /(\w+)::([\w\d_-]+)::([\w\d]+)/
    if not mergeFmtRe.test @options.merge
      warlock.fatal "Invalid merge directive in #{@name} flow: #{@options.merge}"

    mergeComponents = mergeFmtRe.exec @options.merge
    @merge =
      type: mergeComponents[1]
      target: mergeComponents[2]
      queue: mergeComponents[3]

    if @merge.type not in [ 'queue', 'flow' ]
      warlock.fatal "Invalid merge type '#{@merge.type}' in merge directive of flow #{@name}."

    # register dependency with other flow
    @priorTo.push @merge.target

  if @options.depends?
    @deps = @options.depends
  else
    @deps = []

  # Create a clean task if requested.
  if @options.clean and @options.dest?
    task = warlock.task.addCleanTask @name, warlock.config.process( @options.dest )
    @deps.push task

  @

##
# Adds a new stream to the this flow.
##
Flow::add = ( priority, name, streams, options ) ->
  if @usedPriorities.indexOf( priority ) isnt -1
    warlock.log.warning "Warning loading stream '#{name}': multiple tasks in '#{@name}' flow are " +
      "set to run at #{priority}. There is no guarantee which will run first."
  else
    @usedPriorities.push priority

  @steps.push
    name: name
    priority: priority
    run: streams
    options: options

  warlock.debug.log "[#{@name}] Added stream to queue: #{name}"
  this

##
# TODO(jdm): Implement watch functionality.
##
Flow::watch = ( priority, fn ) ->
  # TODO(jdm): what to do here?
  this

##
# Execute this flow.
##
Flow::run = () ->
  warlock.verbose.log "[#{@name}] Starting run."

  currentStream = () -> @stream
  warlock.util.mout.object.forOwn @queues, ( queue, priority ) =>
    # We handle these manually, so go ahead and ignore them.
    return if priority in [ 'pre', 'post' ]

    @add priority, "merge@#{priority}", queue

  # Get the steps we need to run in the order we need to run them.
  steps = warlock.util.mout.array.sortBy @steps, 'priority'

  # Create the stream by either calling the provided function or reading files from disk. Then
  # add it into the pre queue with anything another flow may have merged here.
  sources = @getSources()
  if warlock.util.isFunction sources
    sources = sources()

    # TODO(jdm): Pipe the result to a validation map to ensure we're dealing with Files.
    if not warlock.util.isStream sources
      warlock.fatal "[#{@name}] The source function did not return a stream."

    @queues.pre.push sources
  else
    if sources.length is 0 and @queues.pre.length is 0
      warlock.log.warning "[#{@name}] Got empty globbing pattern. Skipping flow."
      return

    @queues.pre.push warlock.streams.fileReadStream( sources, @options.source_options )

  # The pre-queue is now completely done.
  @stream = @_mergeArrayOfStreams @queues.pre

  steps.forEach ( step ) =>
    # Only pipe to this stream if not disabled
    if warlock.task.isPrevented step.name
      warlock.verbose.log "[#{@name}] Stream #{step.name} prevented from running."
    else
      dest = step.run

      if step.options?.collect
        @stream = @stream.collect()

      # If it's a raw handler, we pass it a stream and trust that it returns one as well.
      if step.options?.raw
        warlock.verbose.log "[#{@name}] Handing stream off to #{step.name}."
        @stream = dest warlock.config( "tasks.#{step.name}" ), warlock.streams.highland( @stream )

        warlock.fatal "#{@name}.#{step.name} did not return a stream." if not warlock.util.isStream @stream
      else
        warlock.verbose.log "[#{@name}] Piping stream to #{step.name}."
        if warlock.util.isFunction dest
          dest = dest warlock.config( "tasks.#{step.name}" )

        if warlock.util.isArray dest
          dest.push @stream
          @stream = @_mergeArrayOfStreams dest
        else
          @stream = @stream.pipe dest

      if step.options?.collect
        @stream = @stream.flatten()

  # Add it into the post queue with anything another flow may have merged here.
  @queues.post.push @stream
  @stream = @_mergeArrayOfStreams @queues.post

  if @options.passive
    if @merge? or @options.dest?
      warlock.fatal "[#{@name}] Cannot be passive, yet have a destination."
    return @stream

  else if @merge?
    # FIXME(jdm): We need to check that the flow exists first; if an invalid flow is defined, it
    # will actually be created here and never run, of course!
    warlock.verbose.log "[#{@name}] Merging with #{@merge.target}@#{@merge.queue}"
    flow( @merge.target ).addToQueue @merge.queue, @stream

    # We must return nothing so the task manager does NOT wait.
    return
  else if @options.dest?
    dest = warlock.config.process @options.dest
    warlock.verbose.log "[#{@name}] Adding destination stream #{dest}"
    @stream = @stream.pipe warlock.streams.fileWriteStream( dest, @options.dest_options )

    # We must return the stream so the task manager knows to wait.
    return @stream
  else
    warlock.log.warning "[#{@name}] No destination specified; this entire flow went nowhere."
    return @stream

##
# A convenience method for creating a merged stream from an array of individual streams.
##
Flow::_mergeArrayOfStreams = ( streams ) ->
  streams = streams.map ( s ) -> warlock.streams.highland( s ).collect()
  warlock.streams.highland( streams ).merge().flatten()

##
# Should this flow's destination be cleaned before execution?
##
Flow::shouldBeCleaned = () ->
  @options.clean? and @options.clean

##
# Does this flow have a watch associated with it?
##
Flow::shouldBeWatched = () ->
  if not @options.watch? or @options.watch then true else false

##
# Retrieve this flow's dependencies.
##
Flow::getDependencies = () ->
  @deps

##
# Get a list of streams in this flow, sorted by their priority.
##
Flow::getStreams = () ->
  warlock.util.mout.array.sortBy @steps, 'priority'

##
# Get the sources specified when this flow was defined.
##
Flow::getSources = () ->
  unless warlock.util.isFunction @options.source
    warlock.util.mout.array.flatten warlock.config.process( @options.source )
  else
    @options.source

##
# Get the tasks in which this flow should be included.
##
Flow::getTasks = () ->
  @_tasks

##
# Add a stream to a queue within this flow so it can later be merged, creating it if one does not
# exist.
##
Flow::addToQueue = ( queue, stream ) ->
  @queues[queue] = [] if not @queues[queue]?
  @queues[queue].push stream

Flow::getTaskName = () ->
  "flow::#{@name}"

##
# This module is just a function that creates a flow if it does not exist and returns it.
# TODO(jdm): Add ability to re-define an existing stream.
##
module.exports = flow = ( name, options ) ->
  if flows[ name ]?
    if options?
      warlock.verbose.log "The flow '#{name}' already exists, so I'm updating the options instead."
      flows[ name ].setOptions options
  else
    flows[ name ] = new Flow( name, options )

  flows[ name ]

###
# Get all defined flows.
###
flow.all = () ->
  MOUT.object.values flows

flow.validate = () ->
  MOUT.object.forOwn flows, ( flow ) ->
    flow.validate()

###
# Get a list of flows by the meta tags during which they should run.
###
flow.getMetaTasks = () ->
  # return the cached version if we can
  return metaTaskCache if metaTaskCache?

  metaTasks = {}

  flow.all().forEach ( flow ) ->
    flow.getTasks().forEach ( task ) ->
      if not metaTasks[task]?
        metaTasks[task] = []
      metaTasks[task].push flow.getTaskName()

  metaTaskCache = metaTasks

flow.getFromTaskName = ( taskName ) ->
  matches = taskName.match /^flow::(.+)$/
  return if not matches? or matches.length isnt 2

  flows[ matches[1] ]

