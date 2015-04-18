import browserSpell from 'warlock-browser-spell'
import {GulpTask} from 'warlock/Task'
import WarlockPipeline from 'warlock/Pipeline'

import gulpNgAnnotate from 'gulp-ng-annotate'
import gulpNgTplCache from 'gulp-angular-templatecache'

class AngularTemplatePipline extends WarlockTask {
  constructor () {
    super( 'templates', {
      tasks: {
        'ng-template-cache': {
          root: '$tplcache/',
          standalone: true,
          module: 'templates'
        }
      }
    });

    this.append( new GulpTask( 'ng-template-cache', gulpNgTplCache ) );
  }
}

// Protect injections from mangling
browserSpell.pipeline( 'source::javascript' )
  .before( 'uglify', new GulpTask( 'ng-annotate', gulpNgAnnotate ) )
  ;

// Remove templates from HTML processing
browserSpell.pipeline( 'source::html' )
  .filter( '!**/*.tpl.html' )
  ;

// Compile templates
browserSpell.tree( 'source' )
  .pipeline( new AngularTemplatePipline(), {
    filter: [ 'src/**/*.tpl.html' ],
    merge: { pipeline: 'javascripts', before: 'uglify' }
  })
  ;

