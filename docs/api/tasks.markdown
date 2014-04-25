# warlock.task

The Warlock task runner, responsible for triggering tasks and managing order and dependencies.

## warlock.task.engage( [ tasks ] ) : Promise

Kicks of a task or series of tasks.

All tasks will run in parallel unless dependencies prevent it. If no task is provided, Warlock will
attempt to run one called `default`. If a provided task does not exist, if a dependency cannot be
resolved, or if tasks depend on each other (directly or indirectly), it will throw an error. This
method returns a promise that will be resolved either on failure or on completion of all requested
tasks.

This is called automatically by the CLI, but if Warlock is controlled programmatically, it may be
called freely by the user at any time once Warlock is bootstrapped.

Aliased as `warlock.engage`.

## warlock.task.watch( [ tasks ] ) : Promise

Aliased as `warlock.watch`.

## warlock.task.getTasks() : Array

Returns a complete list of available tasks with their appropriately-sequenced dependencies.

This will throw an error if a dependent task does not exist or if tasks depend on each other,
directly or indirectly.

*TODO(jdm):* Document Task object API.

## warlock.task.addCleanTask( name, target ) : String

Adds a new task that simply recursively removes the target directory or file pattern.

Flows will automatically be cleaned if the `clean` flag is set to `true`, so this will only be
useful for non-flow cleaning. Returns the name of the created task.

## warlock.task.isPrevented( name ) : Boolean

Returns `true` if the provided stream name is prevented by the user's configuration from running.

The `prevent` and `allow` arrays of the Warlock configuration as well as the `--allow` and
`--prevent` command-line flags allow the user to prevent or cancel a prevention of streams within a
flow. For example, to disable the minification/uglification step of the `webapp` spell, one could
set `prevent: [ "webapp-minjs" ]` in their Warlock configuration (defaults to `warlock.json`).

Allowing a task always supersedes preventing a task. This allows you to disable a set of default
streams permanently but allow them on-demand, for example.

*TODO(jdm):* This should support allowing and preventing entire flows and tasks, but some thought
must be put into dependency management here.

