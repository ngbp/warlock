# Warlock Internals

Before you start writing your own plugins or spells, you'll need to know a little bit about how Warlock works.

---

## Core Components

At its core, Warlock has three distinct entities: tasks, flows, and steps/streams. The rest of this guide will discuss these in more detail.

### Tasks

Fundamentally, a "task" is exactly the same as it is in Grunt or Gulp: it's a function you can request Warlock to execute that can optionally depend on one more other tasks.

Though you usually won't need to, any plugin can create a task:

```coffee
module.exports = ( warlock ) ->
  warlock.task.add "taskName", [ "dependsOn1", "dependsOn2" ], () ->
    somethingHappensHere()
```

When you run Warlock, all non-flag arguments are considered tasks to execute, just like Grunt and Gulp. So running `warlock taskName` will run the above task, first executing `dependsOn1` and `dependsOn2`. If no task is specified to the command line, Warlock will attempt to run the task called `default`, warning if one has not been defined. You can always specify which tasks you want to run by default by adding them to the `defaults` array of your `warlock.json` file (but most of the time spells will have done this for you):

```json
{
  "default": [ "taskName" ]
}
```

By default, Warlock tries very hard to run tasks in parallel. Without a dependency to resolve, *all* tasks run in parallel. In the above example, `dependsOn1` and `dependsOn2` will run in parallel (assuming one does not depend on the other), but because `taskName` depends on them, it will not run until after they have finished. Without explicit dependencies, you *cannot assume any order to when tasks execute*.

It may seem strange that you won't usually need to define tasks yourself, but that's because the magic of Warlock lays elsewhere. In the vast majority of cases, Warlock will create the necessary tasks *for you* based on the flows you define.

You can see all defined tasks by running `warlock --tasks`.

### Flows

The core concept of Warlock is that everything works in "flows". Flows specify a type of something, where it comes from, what we want to do with it, and where we want it to end up. For example, in building a web app, the "scripts" flow might read a bunch of JavaScript off the disk based on a set of globbing patterns, lint each to ensure they contain no syntactical or stylistic errors, and then write them to build directory. That's a flow.

Any application can have any number of flows. Web applications have four by default: HTML, JavaScript, CSS, and assets. All of them start and end on the file system. But web applications often need to use other types or resources, like CoffeeScript or LESS files. Installing the spells for those features creates two new flows to handle them. The CoffeeScript flow, for example, reads the files from disk based on a configurable globbing pattern, lints them, compiles them, and then merges the contents of the flow into the JavaScript flow, leaving it to the JavaScript flow to decide what to do with them. The key lesson here is that regardless of how we code our application, there are a finite number of "end results" - really, just the four mentioned before. Once a CoffeeScript file becomes JavaScript, we no longer care that it *was* CoffeeScript and instead only care that it *is* JavaScript.

Here's a primitive diagram to show how this works:

[![Warlock Flows and Spells Concepts](https://docs.google.com/drawings/d/1CIE680YNionj7KbqQHJu6Wj0s7CMkq0UC62TqSZnpCs/pub?w=960&h=540)](https://docs.google.com/drawings/d/1CIE680YNionj7KbqQHJu6Wj0s7CMkq0UC62TqSZnpCs/edit?usp=sharing)

The horizontal rows are flows, the orange nodes are interactions with the filesystem, the blue nodes are "steps" or "streams" covered in the next section, and the gray dotted lines represent spells that build upon the `warlock-spell-webapp`, eventually merging their contents into one of its existing flows.

Note that in the vast majority of cases it will *make sense* to merge, plugins or spells need not do so: they can write their contents to the filesystem if need be.

When flows are defined, tasks for them are automatically created. The `scripts-to-build` flow of the web app spell is available as a runnable task called `flow::scripts-to-build`. Flows can also ask to be part of certain "meta tasks", which are simply collections of flows to run. For example, the web app spell defines two meta tasks: `webapp-build` and `webapp-compile`. The former makes a runnable, development version of the application, while the latter creates a production version, ready for publishing. The spell then specifies which of its flows to run in which meta task.

Remember, tasks run in parallel, so `webapp-build` will have several flows running at once. On occasion, we need a flow to finish before another starts, so Warlock gives the ability to specify that a flow must finish before another starts. Warlock also handles dependencies automatically, where it can. For example, if flow `A` merges into flow `B`, the latter will have a dependency on the former so that when it runs, the contents of the former are ready to merge.

You can see all defined flows by running `warlock --flows`.

### Steps / Streams

So far, this is all very "meta". "Steps" are where the thing actually happens.

Flows can contain any number of steps to occur in any specified order. When a spell defines what is to happen with CoffeeScript, for example, it defines two steps: linting and compiling. These are [node streams](http://nodejs.org/api/stream.html). Node streams are complicated topic and beyond the scope of this article, but they are essentially decoupled, asynchronous readers, writers, and/or transformers of data. Streams are what you "pipe" to when using Gulp.

Based on the order of the steps, data is sent asynchronously through each as files are read. To continue with the CoffeeScript example: as files are read from the system, they are "piped" to the linting stream; and as the contents are linted, they are "piped" to the compiling stream, and so on.

Because steps occur in order, we have the ability to "inject" steps between two others simply by specifying a numerical priority that lay between the two. As an example, let's say our CoffeeScript files were special and needed to be put through the templating engine first (say, to get the app version number or something), e.g.:

```coffee
class Whatever:
  constructor: ( @options ) ->
    @version = "<%= pkg.version %>"
```

Here's the CoffeeScript flow (slightly simplified):

```coffee
module.exports = ( warlock ) ->
  warlock.flow 'coffee-to-build',
    source: [ '<%= globs.source.coffeescript %>' ]
    source_options:
      base: "<%= paths.source_app %>"
    tasks: [ 'webapp-build' ]
    merge: 'flow::scripts-to-build::90'

  .add( 10, 'coffeescript-lint.lint', coffeelint )
  .add( 50, 'coffeescript-compile', coffee )
```

Because it's potentially manipulating the CoffeeScript, we want to run the templating engine *before* it's linted, which occurs at priority "10". In our own plugin, we can modify it like so:

```coffee
module.exports = ( warlock ) ->
  warlock.flow( 'coffee-to-build' )
  .add( 9, 'coffeescript-tpl', warlock.streams.template )
```

What's happening here is simple: we get a reference to the flow we want to manipulate and then we add the step we want. The first argument is the priority by which the steps are ordered; the second is a name used for reporting and for [configuration](/ngbp/warlock/wiki/Configuration#plugins--spells); and the third is a function that will be executed when the step runs that returns the stream to which the files will be piped. That's it.

Warlock aims to be uber-flexible. Flows can merge; their steps can be dynamic; steps can be inserted; configuration is inherited.

## Spells / Plugins

**Coming soon.**
