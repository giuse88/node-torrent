var fs = require('fs'),
		bencode = require('bencode');
var LOGGER = require('log4js').getLogger('metadata/file.js');

/**
 * Retrieve torrent metadata from the filesystem.
 */
var FileMetadata = {

	load: function(url, callback) {
    
		var path;
		if (url.match(/^file:/)) {
			path = url.substring(7);
		} else {
			path = url;
		}

    path = path.toString();

    console.log( "Type " + typeof path);
		LOGGER.debug('Reading file metadata from ' + path);
		
    fs.readFile(path, function(error, data) {
			if (error) {
				callback(error);
			} else {

					var metadata = bencode.decode(data);
					callback(null, metadata);
		      LOGGER.debug("ok");
			//	} catch(e) {
		     // LOGGER.debug("errore" + e);
			//		callback(e);
			//	}
			}
		});
	}
};

module.exports = exports = FileMetadata;

/*

var R = require('./lib/metadata/file')
var r = new R('file:///home/mstewar/Downloads/ubuntu-12.10-desktop-amd64.iso.torrent');
r.retrieve(function(){console.log(arguments);});

*/
