import util from './util'
import immutable from 'immutable'

/**
 * Tasks
 */

export default class WarlockTask {
  constructor ( name, options = {} ) {
    if ( ! util.isString( name ) || name === '' ) {
      throw new Error( 'Tasks must have a name.' );
    }

    // We should merge in a default config passed to the constructor, which will be supplemented at
    // runtime by the user config. E.g.:
    options.$$name = name;
    this._options = immutable.fromJS( options );
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
  _run ( stream, metadata = new immutable.Map({}) ) {
    var env = this.options().get( 'environment' );
    var targetEnv = metadata.get( 'environment' );

    // TODO(jdm): check if task is disabled

    // If this task is restricted to a certain environment and we're not in it, don't run it.
    if ( env && targetEnv ) {

      // Convert one environment to an array of one environment, for consistency.
      if ( util.isString( env ) ) {
        // TODO(jdm): persist this change
        env = immutable.List.of( env );
      }

      // TODO(jdm): throw an error if not a List

      // If the environments don't match, we shouldn't run this task. Log an info and
      // return the stream unhanged.
      if ( ! env.contains( targetEnv ) ) {
        // TODO(jdm): Log that we're skipping this task because the environment didn't match.
        // warlock.info( `Task ${this.name} skipped in ${metadata.environment}.` );
        return stream;
      }
    }

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

