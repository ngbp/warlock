# Warlock

[![NPM version][npm-version-img]][npm-version-url]
[![Build Status][travis-img]][travis-url]
[![Coverage Status][coveralls-img]][coveralls-url]
[![Dependency Status][dep-status-img]][dep-status-url]
[![Code Climate][cc-img]][cc-url]

[npm-version-img]: https://badge.fury.io/js/warlock-engine.svg
[npm-version-url]: http://badge.fury.io/js/warlock-engine
[travis-img]: https://travis-ci.org/ngbp/warlock.svg
[travis-url]: https://travis-ci.org/ngbp/warlock
[coveralls-img]: https://img.shields.io/coveralls/ngbp/warlock/rewrite.svg
[coveralls-url]: https://coveralls.io/r/ngbp/warlock
[dep-status-url]: https://david-dm.org/ngbp/warlock
[dep-status-img]: https://david-dm.org/ngbp/warlock.svg
[cc-img]: https://codeclimate.com/github/ngbp/warlock/badges/gpa.svg
[cc-url]: https://codeclimate.com/github/ngbp/warlock

Warlock is a JavaScript meta build system that can do just about anything.


## What It is

## What It Is Not

Warlock is not a task runner like Grunt or Gulp. Warlock may be executed through such a task
manager, but serves a fundamentally different purpose. Instead of allowing the user to define
arbitrary tasks, Warlock focuses on *building* things.

## Roadmap

### Engine

High priority
- Automatically read in all registered spells
- Automatically read in all registered plugins
- Read in source trees, filter to appropriate pipelines
- Run pipelines and tasks in correct order
- Clean target trees

Medium Priority
- Run pipelines synchronously, if requested
- Watch trees for changes, if requested
- Run a local server with live reload
- Create a wrapper around gulp plugins to create tasks on the fly without configuration

Low Priority
- Caching helpers
- Support n:m pipelines in addition to n:1

### Plugins / Spells / Tasks

High Priority
- A template processing task that provides an api to use from within the template.
  - reads in the pipelines from `engine` and exposes the results of completed pipelines. E.g. `<%
    warlock.pipeline( 'browser::source::javascripts' ).files.forEach()`.
  - provides access to the immutable config
- Concat task
- Javascript Pipeline
  - JSHint
  - Uglify
- CSS pipeline
  - Lint
  - Min
- HTML Pipeline
- Static Asset Pipeline
- Rename task

Medium Priority
- AngularJS plugin
- SASS Pipeline
- LESS Pipeline
- CoffeeScript Pipeline
- TypeScript Pipeline
- ES6 Pipeline
- Rename task
- Asset Versioning
- Browserify plugin
- Karma plugin

Low Priority
- Myth CSS Pipeline
- Gzip Task

### CLI

High Priority
- `warlock` run all spells
- `warlock browser`: run a single spell
- `--env`: specify a particular environment in which to run
- `--spells`: list installed spells
- `--pipelines`: list pipelines attached to spells
- `--conf`: read out a property from the configuration

Medium Priority
- `warlock browser -p javascript`: run a single pipeline from a spell
  - `warlock browser::javascript`: shorthand
- `--sync`: run everything synchronously

Low Priority
- `warlock browser -t source`: run all pipelines against a single tree, rather than against all

