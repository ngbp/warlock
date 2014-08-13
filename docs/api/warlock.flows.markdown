# warlock.flow

The API for the magic of Warlock: collections of mergeable streams called "flows".

## warlock.flow( name, [options] ) : Flow

Creates a new Flow or fetches an existing one.

If `options` is specified, a new flow is created, passing the name and options directly to the Flow
constructor; however, altering flow definitions is not yet implemented, so if the flow already
exists, an error will be thrown. See the Flow class for more information on the available options.

Returns the flow.

## warlock.flow.all() : Array

Returns an array of all defined flows.

This should not be used by plugins as they are read in no defined order, so this list is almost
guaranteed to be incomplete until after Warlock finishes bootstrapping.

## warlock.flow.getMetaTasks() : Object

Returns an object where its properties are the names of tasks and its values are arrays of the flows
that should run during said tasks. Populated from `options.tasks` when a flow is created.

## warlock.flow.getFromTaskName( taskname ) : Flow

Gets a flow based on its task name in Warlock, or `undefined` if no such flow exists.

## warlock.flow::constructor( name, options ) : Flow

The Flow constructor.

The `name` of the flow is used throughout Warlock and must be unique. The `options` passed configure
the behavior of the flow. `options` *must* contain a `source` value and either an `options.dest` or
an `options.merge` value must be specified so the stream has somewhere to start and somewhere to end
up.

### Options

**`source`:** The stream must originate somewhere. This can be either: (1) a string or an array of
string globbing patterns to be read in; or (2) a function that returns a readable stream.

**`source_options`:** Options to be passed to [vinyl-fs](https://github.com/wearefractal/vinyl-fs)'s
`src` method to configure how the Vinyl file objects are created from the source globs. This is
ignored if `options.source` is a function.

**`dest`:** A string path to which the files at the end of the stream should be written.

**`merge`:** To build isolated, stand-alone, reusable, and composable flows, it can be helpful to be
able to merge a stream in with another flow. For example, the `webapp` spell defines a set of flows
for working with CSS, JavaScript, HTML, and static assets; if you want to include LESS or
  CoffeeScript functionality as well, those spells can lint and process the source files and request
  that they be merged into the upstream `webapp` flow. Warlock will automatically handle task
  dependencies.

A merge is a string directive specifying the type of merge, the target of the merge, and the
priority at which it will merge in the format: `type::target::queue`. At present, only two types of
merges are supported: `queue` and `flow`. A `flow` type merge essentially adds a new stream at the
specified priority to the target flow at runtime, wherein it merges the last stream of this flow
into the stream of the other flow. In the CoffeeScript example, we want it to merge into the
`scripts-to-build` flow *after* all the JavaScript linting (priority 12) but *before* the JavaScript
file paths are saved for use in the template (priority 100); to ensure it occurs after anything any
other task might be merging into that flow too, we pick a relatively high number. Thus, the merge
directive is `flow::scripts-to-build::90`.

**`tasks`:** An array specifying the tasks during which this flow should run. These tasks must be
defined elsewhere. This is usually used by plugins to aggregate a set of flows to run with one
command, e.g. `warlock build` can run five different flows if `[ "build" ]` is specified under the
`options.tasks` for each of the five flows. Plugins can work together as well; a plugin (or you, for
that matter!) can add your own flows to tasks.

**`depends`:** By default, every task in Warlock that *can* run concurrently *does*. So a task
comprised of five flows could see all flows running at the same time. But sometimes, a flow
shouldn't start until another task or flow has completed. An task name or an array of task names can
be specified here to ensure they complete before this flow starts. Warlock automatically handles
this where it can; for example, if task `A` merges into task `B`, Warlock will *automatically* set
`B` to depend on `A`, and so such a dependency need not be specified here. Flows should, where
possible, be isolated components.

**`clean`:** Whether or not the path specified in `options.dest` should be deleted from disk prior
to running this flow. Defaults to false. If `options.dest` is not specified, this is ignored.

**`watch`:** Whether or not this flow should have a watcher set up. Defaults to true. When watching
is enabled, when the any files identified by the `options.source` globs change, this flow is
executed, preceded by any dependencies and followed by any merge targets. By default, only files
that have changed are piped through the streams, so that if a single JavaScript file changes, we do
not throw *all* JavaScript files through the flow.

Watching mergeable flows can be a little tricky. When the simple case leads to challenges, a
configuration object can be passed instead of the simple boolean. For example, it is not always
desirable for a flow to only process *changed* files on watch; sometimes we need to process them all
(e.g. if they get concatenated). We can disable this functionality by passing `{ all: true }`.

This option is ignored when `options.source` is a function, as there is nothing to "watch".

## warlock.flow::add( priority, name, streams ) : Flow

Adds a new stream or streams to which the data will be piped at the specified `priority`/order in
the flow.

When the flow runs, the stream (initially from `options.source`) is piped to each subsequent stream
added to the flow, sorted on the `priority` specified. It returns the flow itself, so it's
chainable. For example, with the following definitions:

```coffeescript
warlock.flow( "myFlow" )
  .add( 10, "task1", task1 )
  .add( 50, "task2", task2 )
  .add( 30, "task3", task3 )
```

Running the flow will essentially do this (highly simplified):

```coffeescript
source
  .pipe( task1() ) # priority 10
  .pipe( task3() ) # priority 30
  .pipe( task2() ) # priority 50
  .pipe( dest )
```

The `streams` argument can either be an array of streams or a function that returns one or more
streams. The latter is by far the most common use case, following the same convention used in other
stream-based frameworks and applications, like [Gulp](http://gulpjs.com). Speaking of Gulp, any Gulp
plugin should be easily used in any Warlock flow:

```coffeescript
coffee = require "gulp-coffee"
warlock.flow( "coffee-to-build" ).add 50, "coffeescript-compile", coffee
```

The stream gets created when it's needed by calling the `coffee` function, passing in a
configuration from the Warlock config based on the name of the stream. If we want to pass in some
configuration options, we can just add them to the global config, so the stream definition remains
clean and fully reusable. The CoffeeScript spell comes with the following default, which can be
easily overridden by your own configuration:

```json
{
  "tasks": {
    "coffeescript-compile": {
      "bare": true
    }
  }
}
```

*TODO(jdm)*: To minimize clashing, it should be based on *both* the flow *and* the stream names,
e.g. `tasks.coffee-to-build.coffeescript-compile`.

Because of the vast assortment of Gulp plugins, there is no need to write your own most of the time
(though it's fairly straightforward when you need to).

On rare occasions, a simple writeable stream won't due; in that event, you can pass `{ raw: true }`
as the `options` parameter. Instead of running the function and piping the latest stream to the
resulting stream, it will pass the latest stream *to* the function and expect the function to return
the latest stream. As an example, `spell-webapp` needs to ensure correct ordering of script and
style files before they are loaded into the configuration for the template to automatically insert.
Since streams are inherently asynchronous, we cannot use the standard method. Instead, we can do
this:

```coffee
warlock.flow( 'scripts-to-build' )
.add( 100, 'webapp-sort', ( options, stream ) ->
    stream.collect()
      .invoke( 'sort', [ util.sortVendorFirst warlock.config "globs.vendor.js" ] )
      .flatten(), { raw: true } )
```

This is a very advanced usage, but the meaning of the code is fairly straightforward: take the
stream; collect all data written to it into an array; invoke the `sort` method on the array, passing
in the sorting algorithm; and return a new stream that emits the re-ordered results.

## warlock.flow::run()

The method that kicks off the run of a particular flow. This should never be called by the user.

## warlock.flow::shouldBeCleaned() : Boolean

Whether or not this flow needs a clean task.

## warlock.flow::shouldBeWatched() : Boolean

Whether or not this flow should be executed whenever its source changes. This only takes into
consideration whether this flow is *configured* to handle a watch, not whether a watch is currently
running.

## warlock.flow::getDependencies() : Array

Retrieves the list of dependencies on this flow. From `options.depends` as well as any flows that
Warlock is able to determine must run first, such as those that merge into this task.

## warlock.flow::getStreams() : Array

Retrieves the set of streams/steps attached to this flow. Excludes merges.

## warlock.flow::getSources() : Array|Function

Gets the sources specified at flow creation, processed as a template by `warlock.config.process`, or
the function provided as `options.source`.

## warlock.flow::getTasks() : Array

Gets the names of the tasks during which this flow has requested to run. From `options.tasks`.

## warlock.flow::getTaskName() : String

Get the name of the task under which this flow will be listed. As of this writing, it is
"flow::<flowname>".

## warlock.flow::addToQueue( queue, stream )

Adds an external stream to the specified merge queue, creating the merge queue if it doesn't exist.
This is used internally to handle merging.

