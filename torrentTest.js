/**
 *
 * Created with JetBrains WebStorm.
 * User: giuseppe
 * Date: 23/12/2013
 * Time: 14:02
 * To change this template use File | Settings | File Templates.
 */
Torrent = require("./lib/torrent/torrent");
Piece = require('./lib/piece');


(function() {

   var port = 6881;
   var endPort = port + 8;
   function padId(id) {

        var newId = new Buffer(20);
        newId.write(id, 0, 'ascii');

        var start = id.length;
        for (var i = start; i < 20; i++) {
            newId[i] = Math.floor(Math.random() * 255);
        }
        return newId;
    }

   console.log("Test torrent.js class");
   var torrent = new Torrent(padId("PES"), port, ".", "sample.torrent", null);
   torrent.on(Torrent.READY, function() {torrent.start();});
   torrent.on(Torrent.PIECE_COMPLETE, function(piece) {

       console.log("HASH   : "  + piece.hash);
       console.log("INDEX  : "  + piece.index);
       console.log("OFFSET : "  + piece.offset);
       console.log("LENGTH : "  + piece.length);
    //   console.log("DATA   : "  + piece.data);

   })
  //  console.log(_pieces);
})();
