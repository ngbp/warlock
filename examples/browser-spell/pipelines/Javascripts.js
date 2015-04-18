/**
 * Javascripts Pipeline Definition
 */

import WarlockPipeline from 'warlock/Pipeline'
import warlock from 'warlock'

export default class JavascriptPipeline extends WarlockPipeline {
  constructor () {
    super( 'javascript', {
      // default configuration...
      target: this.options.get( 'app.name' ) + '.js'
    });

    // Define the steps of a pipeline
    // should pipeline steps have names, or just use the task names?
    this
      .append( new JsHintTask() )
      .append( new JsUglifyTask() )
      .append( new ConcatTask() )
      ;
  }
}

