import util from './util'
import immutable from 'immutable'

/**
 * Tasks
 */

export default class WarlockTask {
  constructor ( name ) {
    if ( ! util.isString( name ) || name === '' ) {
      throw new Error( 'Tasks must have a name.' );
    }

    this._options = new immutable.Map({ $$name: name });

    // TODO(jdm): We should merge in a default config passed to the constructor, which will be
    // supplemented at runtime by the user config. E.g.:
    // this.options( config );
  }

  /**
   * Retrieve the immutable Map of options associated with this task.
   */
  options () {
    return this._options;
  }

  /**
   * Return the name of the task as passed to the constructor.
   */
  name () {
    return this.options().get( '$$name' );
  }

  /**
   * Wrap the execution of the this task to allow for internal logic independent of the logic of the
   * task, assumed to be defined in a child class.
   */
  _run ( stream, metadata = {} ) {
    var env = this.options().get( 'env' );

    // TODO(jdm): check if task is disabled

    // TODO(jdm): If this task is restricted to a certain environment and we're not in it, don't run
    // it.

    // We're good, so run the task.
    return this.run( stream, metadata );
  }

  /**
   * Execute the internal logic of this task, starting and ending with a stream of files.
   */
  run ( stream, metadata ) {
    // TODO(jdm): Log an warning if the run method was not overriden.
    // warlock.warn( `Task ${this.name} is empty.` );

    return stream;
  }
}

