# Writing Spells

Writing spells is fairly straightforward, but you'll be utterly incapable if you don't have at least
a cursory grasp of the concepts. Before continuing, be sure you've read [the
tutorial](#/guide/tutorial), [Configuration](#/guide/configuration), and [Warlock
Internals](#/guide/warlock-internals).

---

## Introduction

A spell is simply a plugin; it's a collection of tasks and/or flows along with some default
configuration that a user can employ in their project. More tactically, spells are NPM modules with
the keyword `warlockplugin` which also have one or more files in a `plugins` folder; each of these
files is a module that exports a function that takes the current `warlock` instance as its argument.
As long as a spell is installed, these functions will automatically be executed.

As an example, we'll consider [`warlock-spell-less`](/ngbp/spell-less):

```coffee
# plugins/less.coffee

less = require 'gulp-less'

module.exports = ( warlock ) ->
  warlock.flow 'less-to-build',
    source: [ '<%= globs.source.less %>' ]
    source_options:
      base: "<%= paths.source_app %>"
    tasks: [ 'webapp-build' ]
    merge: 'flow::styles-to-build::90'

  .add( 50, 'less-compile', less )
```

## Flows

Mostly, spells will be a collection of one or more flows. A larger spell like `warlock-spell-webapp`
can contain ten or more flows, while most, like the LESS spell we're considering here, declare but
one. A good rule of thumb for most circumstances is that you'll need one flow for each set of files
you're reading off the disk. With LESS, we're reading one set of files one time, so we only need one
flow.

Flows take [many configuration options](#/api/warlock.flow) to control how they operate. Most of the
time, however, you'll be following a simple pattern: you specify the source of your files, where
they end up, and during what meta task(s) you want to run.  In this example, source of the files is
a globbing pattern. Because we're writing the files out again, it's nice to know which resulting
file came from which source file; specifying a `base` in `source_options` keeps the relative path,
so `src/app/app.less` will be built to `build/scripts/app/app.css`, so it's easy to see where it
came from.

The target of the files in this case, as in most spells you'll write, is not the filesystem but
another flow. LESS files, once compiled, become CSS; when we're done with our flow, we take the
stream and merge it into the `styles-to-build` flow with a high priority so it will occur [after
linting but before
sorting](https://github.com/ngbp/spell-webapp/blob/master/plugins/styles.coffee#L27).

The `tasks` property is an array of during which meta tasks we want this to run; if a specified task
doesn't exist, it will be created. In this case, we're just running it during the `webapp-build`
task, which `warlock-spell-webapp` sets as a default task.

## Steps

So far, we have files read in and then merged with another flow. The steps that are added are where
the magic really happens. Adding steps is [explained in the API docs](#/api/warlock.flow), but the
core is very simple. We need to specify: a priority at which to run if there are multiple steps; a
name used for configuration and reporting; and a function to run.

When Warlock attempts to run that step, it will fetch the configuration value based on the name (in
this case `tasks.less-compile` and call the function with the configuration value as its argument.
The function should return a stream (or an array of streams). The previous step will then be "piped"
to this new stream. 

In the vast majority of cases, we can use pre-existing Gulp plugins. Instead of passing in the
configuration as a function, however, we put it into the config so it can be freely altered by the
user.

## Configuration

Spells set default configuration in `package.json`:

```json
{
  "name": "warlock-spell-less",
  "version": "1.0.0-alpha.1",
  "description": "An addon to add LESS CSS support to the Warlock spell for managing client-side webapps.",
  "keywords": [
    "warlockplugin",
    "warlockspell"
  ],
  "peerDependencies": {
    "warlock-spell-webapp": "~1.0.0"
  },
  "warlock": {
    "globs": {
      "source": {
        "less": [
          "<%= paths.source_app %>/**/*.less"
        ]
      }
    },
    "tasks": {
      "less-compile": {
        "dumpLineNumbers": "comments"
      }
    }
  },
  "dependencies": {
    "gulp-less": "~1.2"
  }
}
```

The `warlockplugin` keyword is *required* for any NPM-based spell to load.

Because our spell is an add-on for `warlock-spell-webapp`, we list it as a peer dependency. This
will ensure both are installed (and therefore loaded).

The `warlock` keyword contains any configuration values we want to inject into the Warlock config.
More information about this process can be found in the [Configuration](#/guide/configuration) page.

Importantly, we create two configuration values: (1) we add a new globbing pattern that our flow
uses to kick itself off; and (2) we set the default configuration for our steps. By keeping these in
configuration, the user can easily override them for any application-specific reason without
modifying the source. The result is that all modules and all plugins become `npm update`-able.
