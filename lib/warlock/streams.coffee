TPL = require 'lodash.template'
VFS = require 'vinyl-fs'
highland = require 'highland'

# warlock
warlock = require './../warlock'

# Exported Module
streams = module.exports = {}

# Run a function on each datum in a stream.
streams.map = ( fn ) ->
  highland().map fn

# A stream to log the names of the files that pass through.
streams.log = () ->
  highland().map ( file ) ->
    warlock.verbose.log "Log reported: #{file.path}"
    file

# A stream to process the contents as a template.
streams.template = ( dest ) ->
  data = warlock.config( "template-data" ) or {}
  data.warlock = warlock

  highland().map ( file ) ->
    return file if file.isNull()
    data.filepath = if file.relative then warlock.file.joinPath dest, file.relative else 
    contents = warlock.util.template file.contents.toString(), data
    file.contents = new Buffer contents
    file

# Create a read stream from a set of file globs.
streams.fileReadStream = ( globs, options ) ->
  options = warlock.config.process( options ) if options?
  highland( VFS.src globs, options )

# Create a write stream from an output path.
streams.fileWriteStream = ( path, options ) ->
  options = warlock.config.process( options ) if options?
  VFS.dest path, options

# Glob Stream
streams.glob = highland.wrapCallback require( "glob" )

# Transform a node callback into a stream.
streams.wrapCallback = highland.wrapCallback

streams.highland = highland

