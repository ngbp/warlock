var mapStream = require('map-stream');
var map = mapStream(function(f, cb) {
        cb( null, f + 1 );
});

map.on('data', function (x) {
    console.log(x);
});

// Pause the stream, should stop emitting data.
map.pause();
map.write(2);
// emits 3
