var crypto = require("crypto");
var util = require('util');

var ProcessUtils = require('./util/processutils');
var BitField = require('./util/bitfield');
var BufferUtils = require('./util/bufferutils');
var EventEmitter = require('events').EventEmitter;
var File = require('./file');

var LOGGER = require('log4js').getLogger('piece.js');

var Piece = function(torrent, index, offset, length, hash, files, callback) {
  EventEmitter.call(this);

  this.complete = new BitField(Math.ceil(length / Piece.CHUNK_LENGTH));
  this.files = [];
  this.hash = hash;
  this.index = index;
  this.length = length;
  this.offset = offset;
  this.requested = new BitField(this.complete.length);
  this.torrent = torrent
  this.blocks = new Array(this.complete.length);
  this.data = null;
  this.length =length;

  this.setMaxListeners(this.requested.length);

  LOGGER.debug("Piece : %s, Torrent %s", this.hash, this.torrent._metadata.name);
/*  var lastMatch = File.NONE;
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    var match = file.contains(this.offset, this.length);
    if (match === File.FULL
        || (match === File.PARTIAL 
            && lastMatch === File.PARTIAL)) {
      this.files.push(file);
    } else if (match === File.PARTIAL) {
      this.files.push(file);
    }
    lastMatch = match;
  }

  var self = this;
  this.isValid(function(valid) {
    if (valid) {
      setState(self, Piece.COMPLETE);
    } else {
      setState(self, Piece.INCOMPLETE);
    }
    //callback();
  });
  */
};
util.inherits(Piece, EventEmitter);

Piece.prototype.cancelRequest = function(begin) {
  var index = begin / Piece.CHUNK_LENGTH;
  this.requested.unset(index);
};

Piece.prototype.getData = function(begin, length, cb) {
  var data = new Buffer(length)
    , dataOffset = 0
    , files = this.files.slice(0)
    , self = this
    ;
  (function next() {
    if (files.length === 0 || dataOffset >= length) {
      cb(null, data);
    } else {
      var file = files.shift();
      file.read(data, dataOffset, self.offset + begin, length, function(error, bytesRead) {
        if (error) {
          cb(error);
        } else {
          dataOffset += bytesRead;
          ProcessUtils.nextTick(next);
        }
      });
    }
  })();
};

Piece.prototype.hasRequestedAllChunks = function() {
  return this.requested.cardinality() === this.requested.length;
};

Piece.prototype.isComplete = function() {
  return this.state === Piece.COMPLETE;
};

Piece.prototype.isValid = function() {
  var self = this;
  this.data = Buffer.concat(this.blocks, this.length);
  LOGGER.debug("Valid function : %d", this.data.length);
  var dataHash = crypto.createHash('sha1').update(this.data).digest();
  dataHash = dataHash.toString('hex');

  LOGGER.debug("sha1 %s %s",dataHash , self.hash);
  return self.hash === dataHash;

};

Piece.prototype.nextChunk = function() {

  if (this.state === Piece.COMPLETE) {
    return null;
  }

  var indices = this.requested.or(this.complete).unsetIndices();
  if (indices.length === 0) {
    return null;
  }
  this.requested.set(indices[0]);
   
  if (indices[0] === this.complete.length - 1
    && this.length % Piece.CHUNK_LENGTH > 0) {
    var length = this.length % Piece.CHUNK_LENGTH;
  } else {
    length = Piece.CHUNK_LENGTH;
  }
  return {
    begin: indices[0] * Piece.CHUNK_LENGTH,
    length: length
  };
};

Piece.prototype.setData = function(data, begin, cb) {

  LOGGER.debug("data size %d", data.length);

  var index = begin / Piece.CHUNK_LENGTH
    , self = this
    , cb = cb || function() {} // TODO: refactor below..
    ;


  if (!this.complete.isSet(index)) {
    this.complete.set(index);

    LOGGER.debug("Debug : %d, cardinatility %d", this.index, this.complete.cardinality()/32);
    var files = this.files.slice(0);

    var str = "";
    for (var i=0; i< 32; i++)
         str += this.complete.isSet(i) ? "1" :"0";

    LOGGER.debug(str);

  /*  function complete(err) {
      if (err) {
        self.complete.unset(index);
        self.requested.unset(index);
        cb(err);
      } else if (self.complete.cardinality() === self.complete.length) {
        self.isValid(function(valid) {
          if (valid) {
            console.log()
            setState(self, Piece.COMPLETE);
          } else {
            LOGGER.debug('invalid piece, clearing.');
            self.complete = new BitField(self.complete.length);
            self.requested = new BitField(self.complete.length);
          }
          cb();
        });
      } else {
        cb();
      }
    }
    */
    this.blocks[index] = new Buffer(data);

    if (self.complete.cardinality() === self.complete.length && self.isValid())
        setState(self, Piece.COMPLETE);


    LOGGER.debug("File length : %s", files.length);
  /*  (function next() {
      if (files.length === 0) {
        complete();
      } else {
        var file = files.shift();
        file.write(self.offset + begin, data, function(match) {
          if (match instanceof Error) {
            complete(match)
          } else {
            ProcessUtils.nextTick(next);
          }
        });
      }
    })();

  */
  } else {
    LOGGER.warn('Attempt to overwrite data at ' + self.offset + '.');
    cb();
  }
};

function setState(self, state) {
  self.state = state;
  self.emit(state, self);
  console.log(state);
  if(state===Piece.COMPLETE)
        self.torrent.emit(self.torrent.PIECE_COMPLETE, self);
}

Piece.CHUNK_LENGTH = 16384;

Piece.COMPLETE = 'complete';
Piece.INCOMPLETE = 'incomplete';

module.exports = Piece;
