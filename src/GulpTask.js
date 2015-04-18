import WarlockTask from './Task'
import util from './util'
import _ from 'highland'

/**
 * For convenience and interop, a wrapper for existing gulp plugins
 */
export default class GulpTask extends WarlockTask {
  constructor ( name, method ) {
    super( name );

    if ( util.isFunction( method ) ) {
      this._method = method;
    } else if ( util.isStream( method ) || util.isNodeStream( method ) ) {
      this._method = () => method;
    } else {
      // TODO(jdm): Throw an error if neither a stream nor method
      // warlock.fatal( `Error creating Gulp task '${this.name()}'. Must pass a stream or method.` );
      console.log("method not a stream", method);
    }
  }

  run ( files ) {
    // Get the stream by executing the Gulp task.
    var stream = this._method( this.options() );

    // We need to return a stream.
    if ( ! util.isStream( stream ) && ! util.isNodeStream( stream ) ) {
      // TODO(jdm): throw an error
      // warlock.fatal( `Gulp task '${this.name()}' did not return a stream.` );
      console.log("method did not return stream", stream);
    }

    return _( files.pipe( stream ) );
  }
}

