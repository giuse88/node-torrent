var Client = require('./lib/client.js');
var client = new Client({logLevel: 'DEBUG'});
var torrent = client.addTorrent('sample.torrent');

// when the torrent completes, move it's files to another area
torrent.on('complete', function() {
    console.log('complete!');
    torrent.files.forEach(function(file) {
    });
});

