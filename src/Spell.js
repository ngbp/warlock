/**
 * Spells
 */

export default class WarlockSpell {
  constructor ( name, options ) {
    this._name = name;
    this.options( options );

    // register itself with warlock
  }

  _trees: []

  trees () {}
  tree ( tree ) {
    this._trees.push( tree );
  }

  options ( options ) {
    // merge opts
    // re-create trees, if necessary
  }

  name () {
    return this._name;
  }

  pipeline ( wp ) {
    // register a new pipeline
  }

  run ( ...tasks ) {
    // run a task against this spell, defaulting to all tasks
    // available tasks.
    //  - t$treename
    //  - p$pipelinename
    //  - clean$pipelinename
    //  - clean (clean all pipelines)
    //  - default (run everything)
  }

  watch () {
    // do an initial run
    run();

    // now watch for changes to dynamic trees and trigger the appropriate pipelines
  }
}


