# Node libraries
MOUT = require 'mout'
ES = require 'event-stream'

# warlock
warlock = require './../warlock'

# Flows currently registered
flows = {}

# Tasks during which flows would like to run.
definedTasks = []

# Priority range
minPriority = 1
maxPriority = 100

class Flow
  constructor: ( @name, @options ) ->

    # Set up some instance variables we'll need later on.
    @steps = []
    @usedPriorities = []
    @priorTo = []

    # Set the array of tasks during which this flow needs to run.
    @options.tasks ?= []
    @options.tasks = [ @options.tasks ] if warlock.util.typeOf( @options.tasks ) isnt 'Array'

    # Ensure the source is valid.
    if not @options.source?
      throw new Error "Flow '#{@name}' has no source. It can't do anything if it starts with nothing."

    if warlock.util.isString @options.source
      @options.source = [ @options.source ]

    if not warlock.util.isFunction( @options.source ) and not warlock.util.isArray( @options.source )
      throw new Error "Flow '#{@name}' has an invalid source. It must be a string path, an array of string paths, or a function that returns a stream."

    if not warlock.util.isFunction( @options.source ) and not warlock.util.isArray( @options.source )
      throw new Error "Invalid source for flow '#{@name}'; expected String, Array, or Function."

    # Ensure the destination is valid.
    if @options.dest and not warlock.util.isString @options.dest
      throw new Error "Flow '#{@name}' has an invalid destination. It must be a string path."

    # Load up the passed-in dependencies, if necessary.
    if warlock.util.isString @options.depends
      @options.depends = [ @options.depends ]

    if @options.depends?
      @deps = @options.depends
    else
      @deps = []

    # Create a clean task if requested.
    if @options.clean and @options.dest?
      task = warlock.task.addCleanTask @name, warlock.config.process( @options.dest )
      @deps.push task

    # Create pre- and post-queues for task injection.
    @queues =
      pre: new warlock.streams.MergeQueue
        objectMode: true
      post: new warlock.streams.MergeQueue
        objectMode: true

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

  add: ( priority, name, fn ) ->
    if @usedPriorities.indexOf( priority ) isnt -1
      warlock.log.warning "Error loading stream '#{name}': multiple tasks in '#{@name}' flow are set to run at #{priority}. There is no guarantee which will run first."
    else
      @usedPriorities.push priority

    @steps.push
      name: name
      priority: priority
      run: fn

    warlock.debug.log "[#{@name}] Added stream to queue: #{name}"
    this


  watch: ( priority, fn ) ->
    # TODO(jdm): what to do here?
    this

  run: ( callback ) ->
    warlock.verbose.log "[#{@name}] Starting run."

    warlock.util.mout.object.forOwn @queues, ( queue, priority ) =>
      # We handle these manually, so go ahead and ignore them.
      return if priority in [ 'pre', 'post' ]

      @add priority, "merge@#{priority}", () =>
        warlock.verbose.log "[#{@name}] Processing stream merge at #{priority}."
        queue.push( @stream ).done()

    # Get the steps we need to run in the order we need to run them.
    steps = warlock.util.mout.array.sortBy @steps, 'priority'

    # Create the stream by either calling the provided function or reading files from disk. Then
    # add it into the pre queue with anything another flow may have merged here.
    sources = @getSources()
    if warlock.util.isFunction sources
      sources = sources()

      # TODO(jdm): This is completely untested!
      if warlock.util.isA sources, "Stream"
        warlock.fatal "[#{@name}] The source function did not return a stream."

      @queues.pre.push @stream
    else
      if sources.length is 0 and @queues.pre.length is 0
        warlock.log.warning "[#{@name}] Got empty globbing pattern. Skipping flow."
        return

    @queues.pre.push warlock.streams.fileReadStream( sources, @options.source_options )

    # The pre-queue is now completely done.
    @stream = @queues.pre.done()
    
    steps.forEach ( step ) =>
      warlock.verbose.log "[#{@name}] Piping stream to #{step.name}."
      # Only pipe to this stream if not disabled
      if warlock.task.isPrevented step.name
        warlock.verbose.log "[#{@name}] Stream #{step.name} prevented from running."
      else
        @stream = @stream.pipe step.run( warlock.config( "tasks.#{step.name}" ) )

    # Add it into the post queue with anything another flow may have merged here.
    @stream = @queues.post.push( @stream ).done()
    if @merge?
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
      return

  shouldBeCleaned: () ->
    @options.clean? and @options.clean

  getDependencies: () ->
    @deps

  getStreams: () ->
    warlock.util.mout.array.sortBy @steps, 'priority'

  getSources: () ->
    unless warlock.util.isFunction @options.source
      warlock.util.mout.array.flatten warlock.config.process( @options.source )
    else
      @options.source

  addToQueue: ( queue, stream ) ->
    @queues[queue] = new warlock.streams.MergeQueue() if not @queues[queue]?
    @queues[queue].push stream

module.exports = flow = ( name, options ) ->
  if flows[ name ]?
    if options?
      warlock.fatal "The flow '#{name}' already exists."
      # TODO(jdm): Add ability to merge or re-define an existing stream.
  else
    flows[ name ] = new Flow( name, options )

  flows[ name ]

###
# Get all defined flows.
###
flow.all = () ->
  MOUT.object.values flows

