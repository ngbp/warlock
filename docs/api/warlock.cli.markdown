# warlock.cli

The command-line processor for Warlock.

---

## warlock.cli() : Promise

Process the command line and do what needs to be done.

This is called by `warlock-cli`, which powers the `warlock` command-line. It processes the command
line flags and arguments, printing out or manipulating any requested information and then running
whatever tasks are necessary. The method returns a promise that will return `true` when the
everything is complete, or an error on failure.

This should never need to be called by a user directly.  For information on the CLI, type `warlock
--help` to see a list of available flags, or visit the CLI guide.

