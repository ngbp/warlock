/**
 * Define a new spell to handle browser-based apps.
 */

import WarlockSpell from 'warlock/Spell'

import JavascriptPipeline from './pipelines/javascript'
import CssPipeline from './pipelines/css'
import AssetPipeline from './pipelines/asset'

class BrowserSpell extends WarlockSpell {
  constructor () {
    super( 'browser' );

    // The trees represent the entry points for this spell to act.
    // How do we handle overlapping directories?
    this.tree( 'source', {
      // base this on an entire directory
      dir: 'src'
    })
    .pipeline( new JavascriptPipeline(), { filter: [ '**/*.js' ] } )
    .pipeline( new CssPipeline(), { filter: [ '**/*.css' ] } )
    .pipeline( new AssetPipeline(), { catchall: true } )
    ;

    this.tree( 'vendor', {
      // don't monitor changes
      dynamic: false,

      // a static array of mixed vendor files, initially empty, as opposed to a directory
      // the angular plugin would insert items here, e.g.
      // perhaps a bower addon adds resources here automatically using an heuristic?
      files: []
    })
    .pipeline( new JavascriptPipeline( { filter: [ '**/*.js' ], exclude: [ 'jshint' ] } ) )
    .pipeline( new CssPipeline( { filter: [ '**/*.css' ], exclude: [ 'csslint' ] } ) )
    .pipeline( new AssetPipeline(), { catchall: true } )
    ;
  }
}

var spell = new BrowserSpell();

export default spell;

