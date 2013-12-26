var Piece = require('../piece');

var LOGGER = require('log4js').getLogger('createpieces.js');

function createPieces(torrent, hashes, files, pieceLength, sizeOfDownload, callback) {
  var pieces = [],
   numberOfPieces = hashes.length,
   lengthOfNextPiece = pieceLength;
   LOGGER.debug("Creating %d", numberOfPieces);
   LOGGER.debug("Size of download %d", sizeOfDownload);

   for ( var i=0; i < numberOfPieces ; i++) {
       if (i === (numberOfPieces - 1)) {
           lengthOfNextPiece = sizeOfDownload % pieceLength;
       }
       var piece = new Piece(torrent, i, i * pieceLength, lengthOfNextPiece, hashes[i], files);
       pieces.push(piece);
    }
  callback(null, pieces);
}

function createPiece(pieces, hashes, files, currentIndex, numberOfPieces, pieceLength, 
    sizeOfDownload, callback) {

  if (currentIndex === numberOfPieces) {
    console.log(pieces);
   // callback(null, pieces);
  }
  else {
    var hash = hashes[currentIndex],
         lengthOfNextPiece = pieceLength;
    if (currentIndex === (numberOfPieces - 1)) {
      lengthOfNextPiece = sizeOfDownload % pieceLength;
    }
    var piece = new Piece(currentIndex, currentIndex * pieceLength, lengthOfNextPiece, hash,
        files, function() {
      createPiece(pieces, hashes, files, currentIndex + 1, numberOfPieces, pieceLength, 
        sizeOfDownload, callback);
    });
  }
}

module.exports = exports = createPieces;
