TPL = require 'lodash.template'
ES = require 'event-stream'
VFS = require 'vinyl-fs'

# warlock
warlock = require './../warlock'

# Exported Module
streams = module.exports = {}

# Convert a stream to a function.
streams.map = ES.map

# A stream to log the names of the files that pass through.
streams.log = () ->
  streams.map ( file, callback ) ->
    warlock.verbose.log "Log reported: #{file.path}"
    callback null, file

# A stream to process the contents as a template.
streams.template = ( dest ) ->
  data = warlock.config( "template-data" ) or {}
  data.warlock = warlock

  streams.map ( file, callback ) ->
    return if file.isNull()

    data.filepath = warlock.file.joinPath dest, file.relative
    contents = warlock.util.template file.contents.toString(), data
    file.contents = new Buffer contents

    callback null, file

# File Stream Creation
streams.fileReadStream = ( globs, options ) ->
  options = warlock.config.process( options ) if options?
  VFS.src globs, options

streams.fileWriteStream = ( path, options ) ->
  options = warlock.config.process( options ) if options?
  VFS.dest path, options

# A queue to merge streams.
# NOTE(jdm): This is super minimalist right now, but I had a lot of trouble getting some of the
# existing, over-powered, outdated libs out there to work.
class MergeQueue
  constructor: () ->
    @_streams = []
    @length = 0

  push: ( stream ) ->
    warlock.fatal "The queue has already been emptied; you can't push to it anymore." if @_final?
    @_streams.push stream
    @length = @_streams.length
    @

  done: () ->
    warlock.fatal "The queue has already been emptied!" if @_final?
    @_final = ES.merge.apply ES, @_streams

    # FIXME(jdm): This errors out when we try to `pipe()` unless `end` is defined. But this is way
    # too hackish for my comfort. What did I do wrongly?
    if not @_final.end?
      @_final.end = () -> return

    @_final

streams.MergeQueue = MergeQueue

