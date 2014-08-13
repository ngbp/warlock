---
{
  "priority": 1
}
---

# Configuration

Warlock emphasizes convention over configuration, but aims to be completely configurable.

---

## Overview

Once you get up and running with Warlock, you'll certainly want to customize how things work. Warlock is built with the goal of allowing everything to be customized while still operating in a reasonable and predictable way out of the box.

To allow this, all configurations are merged deeply (i.e. recursively) from their various sources in a specific order using the [`deepmerge`](https://github.com/nrf110/deepmerge) library.

### Defaults

Warlock comes with a very small set of default configuration options that are needed in order to run any project. As of the time of this writing, these are:

```coffeescript
_defaultConfig = 
  # Overwriteable glob patterns tasks can reference or use to make flows.
  globs: {}

  # Overwriteable directories build tasks can reference.
  paths: {}

  # Directories to look for plugins
  plugins: []
   
  # Tasks to prevent from running.
  prevent: []

  # Tasks to inject into one of the flows.
  inject: []

  # The default tasks to run when none are specified.
  default: []
```

You can find the most up to date options in [`config.coffee`](https://github.com/ngbp/warlock/blob/master/lib/warlock/config.coffee#L13). These only exist as the core engine expects them to, but do nothing without having values set from another source.

### Plugins / Spells

Into the defaults, Warlock merges the configurations of the various spells. Spells can add or update options by placing values under the `warlock` key of their `package.json` file. For example, here is the [CoffeeScript spell](/ngbp/spell-coffeescript)'s configuration values:

```json
  "warlock": {
    "globs": {
      "source": {
        "coffeescript": [
          "<%= paths.source_app %>/**/*.coffee",
          "<%= paths.source_app %>/**/*.coffee.md",
          "<%= paths.source_app %>/**/*.coffee.markdown",
          "!<%= paths.source_app %>/**/*.spec.coffee",
          "!<%= paths.source_app %>/**/*.spec.coffee.md",
          "!<%= paths.source_app %>/**/*.spec.coffee.markdown"
        ]
      }
    },
    "tasks": {
      "coffeescript-lint": {
        "failOnError": {
          "fail": true
        }
      },
      "coffeescript-compile": {
        "bare": true
      }
    }
  },
```

These values are fairly straightforward. It adds a set of default globbing patterns for its CoffeeScript compilation tasks to use and it gives some default configuration for its tasks (see [[Writing Plugins]] for more information on how the task configurations are used).

**Important note:** Warlock in no way guarantees the load/merge order of spells. Spells should be self-contained.

### warlock.json

After all spells are loaded, Warlock will merge all values from the user's `warlock.json`, if it exists. Warlock will, by default, start looking in the current directory and then proceed upward in the file system until it finds it (à la Grunt and Gulp). You can specify an alternative location with the `-c path/to/warlock.json` or `--config-file path/to/warlock.json` command-line flags.

As configurations are deep-merged, we can override how tasks function. From above, CoffeeScript will create "bare" files by default (i.e. won't be wrapped in an self-executing anonymous function). We can easily change this by setting the appropriate key in our `warlock.json`:

```json
{
  "tasks": {
    "coffeescript-compile": {
      "bare": false
    }
  }
}
```

Because of the merging order, this latest value will be used. This is one of the keys to Warlock's power.

Similarly, if we happened to have CoffeeScript files in another location, we could add it to the globbing pattern:

```json
{
  "globs": {
    "source": {
      "coffeescript": [
        "path/to/the/**/*.coffee"
      ]
    }
  }
}
```

Because the values are *merged*, the globbing patterns used will be *both* the ones from the spell's `package.json` *and* the ones from `warlock.json`. Use the negator (`!`) to remove an old pattern. In a future release, we'd like to see a way to completely overwrite an array, but for now there is no such functionality.

### warlock --conf

The last and final way to specify configuration values is on the command line using the `--conf` parameter. If you want to find out what globbing patterns will be used, for example, you could run:

```
$ warlock --conf globs.source.coffeescript --raw

globs.source.js = [ "<%= paths.source_app %>/**/*.coffee",
  "<%= paths.source_app %>/**/*.coffee.md",
  "<%= paths.source_app %>/**/*.coffee.markdown",
  "!<%= paths.source_app %>/**/*.spec.coffee",
  "!<%= paths.source_app %>/**/*.spec.coffee.md",
  "!<%= paths.source_app %>/**/*.spec.coffee.markdown",
  "path/to/the/**/*.coffee" ]
```

The `--raw` options gives the un-interpreted configuration value - i.e. precisely what was entered into the configuration file. Without the `--raw` option, it will translate those variables to real paths:

```
$ warlock --conf globs.source.coffeescript

globs.source.js = [ "src/app/**/*.coffee",
  "src/app/**/*.coffee.md",
  "src/app/**/*.coffee.markdown",
  "!src/app/**/*.spec.coffee",
  "!src/app/**/*.spec.coffee.md",
  "!src/app/**/*.spec.coffee.markdown",
  "path/to/the/**/*.coffee" ]
```

We see these values because the [`webapp` spell](/ngbp/spell-webapp) sets the appropriate path variables:

```
$ warlock --conf paths.source_app --raw

paths.source_app = '<%= paths.source %>/app'

$ warlock --conf paths.source_app

paths.source_app = 'src/app'
```

You can interrogate any configuration value in this same manner.

But configuration values can also be set. If we wanted to, for this one run only, add a new globbing pattern, we can to so:

```
$ warlock --conf paths.source_app --set "src/other/**/*.md"

paths.source_app = 'src/other/**/*.md'

Starting tasks: default
...
```

This will merge the configuration in memory and then run the default task (or whatever task was specified). You can make command-line changes permanent by adding the `-w` or `--write` command-line flags, which will add the value to your local `warlock.json` file.

## Important Configuration Options

**This section coming soon.**
