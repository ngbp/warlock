FS = require 'fs'
PATH = require 'path'
Q = require 'q'
rimraf = require 'rimraf'
gaze = require 'gaze'

# warlock
warlock = require './../warlock'

# Exported module
file = module.exports = {}

# Filesystem wrappers
file.readFile = Q.denodeify FS.readFile
file.writeFile = Q.denodeify FS.writeFile
file.pathExists = Q.denodeify FS.exists
file.readFileSync = FS.readFileSync
file.writeFileSync = FS.writeFileSync
file.pathExistsSync = FS.existsSync

# Rimraf
# file.rimraf = ( target ) ->
#   cwd = process.cwd()
#   relative = file.relativePath cwd, target

#   # For the love of all that is holy, do not delete the CWD or anything outside it!
#   if relative is ''
#     warlock.fatal "I will not delete the current working directory."
#   else if relative.substr( 0, 2 ) is '..'
#     warlock.fatal "I will not delete anything outside the current working directory."
    
#   rimraf( target )
#   .catch ( err ) ->
#     warlock.fatal "I couldn't delete #{target}: #{err}"
file.rimraf = rimraf.sync

# Globbing
file.glob = Q.denodeify require( 'glob' )

# Some convenience wrappers.
file.relativePath = ( one, two ) ->
  PATH.relative one, two
file.absolutePath = ( relativePath, start ) ->
  start ?= process.cwd()
  file.joinPath start, relativePath
file.joinPath = ( one, two ) ->
  PATH.join one, two
file.dirname = ( path ) ->
  PATH.dirname path
file.basename = PATH.basename

class Watcher extends gaze.Gaze

# file.Watcher = Watcher
file.Watcher = gaze.Gaze
file.watch = gaze

