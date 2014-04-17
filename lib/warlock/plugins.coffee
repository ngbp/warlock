# Node libraries
PATH = require 'path'

# warlock libraries
warlock = require './../warlock'

plugins = module.exports = {}

pluginRegistry = []

plugins.load = () ->
  warlock.debug.log "Loading all plugins..."
  plugins.loadNpmPlugins()
  .then () ->
    # Load configuration-defined plugins
    pluginPaths = warlock.config 'plugins'
    if not pluginPaths? or pluginPaths.length is 0
      warlock.util.q true
    else
      warlock.util.promise ( deferred ) ->
        warlock.util.each pluginPaths, ( path, callback ) ->
          plugins.loadPlugins( PATH.join( warlock.options( 'projectPath' ), path ) )
          .then () ->
            callback()
          , ( err ) ->
            callback err
        , ( err ) ->
          if err?
            deferred.reject err
          else
            deferred.resolve true

# TODO(jdm): inject tasks from config

plugins.loadPlugins = ( plugin_dir, config ) ->
  warlock.verbose.log "Loading plugins from path '#{plugin_dir}'"

  if pluginRegistry.indexOf( plugin_dir ) isnt -1
    warlock.log.warning "#{plugin_dir} has already been loaded. Skipping it for now."
    warlock.util.q true
  else if not warlock.file.pathExistsSync plugin_dir
    warlock.log.fatal "Plugin directory #{plugin_dir} doesn't exist."
  else
    # Read in the configuration from the provided metadata, if provided.
    if config
      warlock.debug.log "Loading configurations for: #{plugin_dir}"
      warlock.config.merge config

    # Locate all the plugin files.
    warlock.file.glob( PATH.join( plugin_dir, '*.{js,coffee}' ) )
    .then ( files ) ->
      if not files? or files.length is 0
        warlock.log.warning "No plugins found in path #{plugin_dir}"
        warlock.util.q true
      else
        warlock.util.promise ( deferred ) ->
          warlock.util.each files, ( file, callback ) ->
            try
              fn = require file

              if warlock.util.typeOf( fn ) is 'Function'
                fn.call warlock, warlock
                callback()
              else
                warlock.log.warning "#{plugin_dir} doesn't export a function."
                callback()
            catch err
              callback( err )
          , ( err ) ->
            if err?
              deferred.reject err
            else
              deferred.resolve true

plugins.loadNpmPlugins = () ->
  modules_dir = PATH.resolve 'node_modules'

  # Stream all the package files
  warlock.file.glob( PATH.join( modules_dir, '/*/package.json' ) )
  .then ( files ) ->
    if not files?.length
      warlock.debug.log "There were no NPM packages to attempt to load."
      return warlock.util.q true

    warlock.util.promise ( deferred ) ->
      warlock.util.each files, ( file, callback ) ->
        contents = warlock.file.readFileSync( file )
        pkg = warlock.util.parseJsonSync( contents )
        if pkg?.keywords? and pkg.keywords.indexOf( 'warlockplugin' ) isnt -1
          warlock.verbose.log "Found warlock plugin #{pkg.name}"
          # TODO(jdm): handle warlockcollections
          
          plugins.loadPlugins( PATH.join( modules_dir, pkg.name, 'plugins' ), pkg?.warlock )
          .then () ->
            callback()
          , ( err ) ->
            callback err
        else
          callback()
      , ( err ) ->
        if err?
          deferred.reject err
        else
          deferred.resolve true

