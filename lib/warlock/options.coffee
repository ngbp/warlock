data = {}

options = module.exports = ( key, value ) ->
  if arguments.length is 2
    data[ key ] = value
    data[ key ]
  else
    data[ key ]

options.init = ( o ) ->
  data = if o? then o else {}
  @

options._raw = () ->
  data

