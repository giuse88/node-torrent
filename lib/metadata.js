
var bencode = require('bencode'),
    crypto = require("crypto"),
    util = require('util'),
    BitField = require('./util/bitfield')
    EventEmitter = require('events').EventEmitter,
    BufferUtils = require('./util/bufferutils');

var LOGGER = require('log4js').getLogger('metadata.js');

function Metadata(infoHash, metadata) {
  EventEmitter.call(this);
  LOGGER.debug("Creating metadata for  " + metadata.name);
  this.infoHash = infoHash;
  this.bitfield = null;
  this._encodedMetadata = null;
  this._length = 0;
  this.setMetadata(metadata);
}
util.inherits(Metadata, EventEmitter);

Metadata.prototype.isComplete = function() {
  if (!this.bitfield || this.bitfield.length === 0) {
    return false;
  }
  return this.bitfield.cardinality() === this.bitfield.length;
};

Metadata.prototype.hasLength = function() {
  return this._length > 0;
};

Metadata.prototype.piecesToArray = function (pieces){
    var pieces_array = new Array();
    for (var i=0; i < pieces.length/20; i++)
        pieces_array[i] = pieces.toString('hex', i*20, (i+1)*20);
    return pieces_array;
}

Metadata.prototype.setMetadata = function(_metadata) {
  
  if (!_metadata) return;

  var metadata = this;

  Object.keys(_metadata).forEach(function(key) {
    metadata[key] = _metadata[key];
    if (key === "pieces")
        metadata[key] = metadata.piecesToArray(_metadata[key]);
    LOGGER.debug("Added %s : %s ", key, metadata[key]);
  });

  if(this.pieces) {
    LOGGER.debug("Added %d pieces", this.pieces.length);
    this.bitfield = new BitField(this.pieces.length);
    LOGGER.debug("Bit field length : %d", this.bitfield.length);
  } else {
    LOGGER.warn("Pieces array/string is not set");
    exit(0);
  }

  if (!this.infoHash) {
    this.infoHash = new Buffer(crypto.createHash('sha1')
      .update(bencode.encode(_metadata))
      .digest(), 'binary');
    LOGGER.debug("Info Hash : %s", this.infoHash.toString('hex'));
    LOGGER.debug('Metadata complete.');
    this.emit(Metadata.COMPLETE);
  } else if (this.isComplete()) {
    // this is done to support the magnet Linkj
    var infoHash = new Buffer(crypto.createHash('sha1')
      .update(this._encodedMetadata)
      .digest(), 'binary');
    if (!BufferUtils.equal(this.infoHash, infoHash)) {
      LOGGER.warn('Metadata is invalid, reseting.');
      this.bitfield.unsetAll();
      this.emit(Metadata.INVALID);
      throw "BOOM"; // TODO: why does re-encoding the metadata cos this to fail?
    } else {
      LOGGER.debug('Metadata complete.');
      this.emit(Metadata.COMPLETE);
    }
  }
};

Metadata.prototype.setPiece = function(index, data) {
  if (this.bitfield.isSet(index)) {
    return;
  }
  LOGGER.debug('Setting piece at index %d with %d bytes', index, data.length);
  this.bitfield.set(index);
  data.copy(this._encodedMetadata, index * Metadata.BLOCK_SIZE, 0, data.length);
  if (this.isComplete()) {
    this.setMetadata(bencode.decode(this._encodedMetadata));
  }
};

Metadata.COMPLETE = 'metadata:complete';
Metadata.INVALID  = 'metadata:invalid';


module.exports = exports = Metadata;
