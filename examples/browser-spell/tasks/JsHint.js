/**
 * A JSHint task
 */

import WarlockTask from 'warlock/Task'
import gulpJshint from 'gulp-jshint'

class JSHintTask extends WarlockTask {
  constructor ( config ) {
    if ( ! this instanceof JSHintTask ) {
      return new JSHintTask();
    }

    super( 'jshint', config );
  }

  run ( files, metadata ) {
    return files
      .through( gulpJshint( this.options() ) )
      .through( gulpJshint.reporter( stylish ) )
      .doto( ( file ) => {
        if ( ! file.isNull() && lint.failOnError && ( ! file.jshint || ! file.jshint.success ) ) {
          warlock.fatal( "One or more JS files contain errors, so I'm exiting now." );
        }
      });
  }
}

