'use strict'

var util = require('util')
var stream = require('readable-stream')
var IncomingMessage = require('./lib/incoming-message')
var debug = require('./lib/debug')

var HEADER_MAX_BYTES = 1024 // TODO: Figure out the best max size of the header
var CR = 0x0d
var NL = 0x0a
var NO_BODY_STATUS_CODES = [100, 304]

var Decoder = module.exports = function (opts) {
  if (!(this instanceof Decoder)) return new Decoder(opts)

  stream.Writable.call(this, opts)

  this._inBody = false
  this._headerOffset = 0
  this._header = new Buffer(HEADER_MAX_BYTES)
  this._bodyBytesWritten = 0
}

util.inherits(Decoder, stream.Writable)

Decoder.prototype._write = function (chunk, encoding, cb) {
  this._writeOffset(chunk, 0, cb)
}

Decoder.prototype._writeOffset = function (chunk, offset, cb) {
  while (offset < chunk.length) {
    debug('decoding chunk', util.inspect(chunk.slice(offset).toString()))
    if (this._inBody) {
      offset = this._writeBody(chunk, offset, cb)
      if (offset === 0) return // chunk not consumed - _writeOffset will be called again when ready
    } else {
      offset = this._writeHead(chunk, offset)
    }
  }
  cb()
}

Decoder.prototype._writeHead = function (chunk, offset) {
  if (this._headerOffset === 0) debug('start of header')

  chunk.copy(this._header, this._headerOffset, offset)
  var origHeaderOffset = this._headerOffset
  this._headerOffset += chunk.length - offset
  var bodyStart = offset + indexOfBody(this._header, Math.max(origHeaderOffset - 3, 0), this._headerOffset)
  if (!~bodyStart) return chunk.length // still reading the header

  debug('end of header')

  this._msg = new IncomingMessage(this._header)

  this._headerOffset = 0
  this._header = new Buffer(HEADER_MAX_BYTES)

  if (~NO_BODY_STATUS_CODES.indexOf(this._msg.statusCode)) {
    this._bodySize = 0
  } else {
    this._bodySize = parseInt(this._msg.headers['content-length'], 10) || 0
  }

  if (this._bodySize > 0) this._inBody = true

  // _writeBody logic to handle back-pressure
  var self = this
  this._msg.on('drain', function () {
    if (!this._chunk) return
    self._writeOffset(this._chunk, this._end, this._cb)
    this._chunk = null
    this._end = null
    this._cb = null
  })

  if (this._msg.method) this.emit('request', this._msg)
  else this.emit('response', this._msg)

  return bodyStart - origHeaderOffset
}

// If the given chunk cannot be consumed due to back-pressure, _writeBody will
// return 0 indicating that no part of the chunk have been processed. At the
// same time _writeBody will take over responsibility for the chunk. The
// callback is only called in that particular case
Decoder.prototype._writeBody = function (chunk, offset, cb) {
  if (this._bodyBytesWritten === 0) debug('start of body')

  var bytesLeft = this._bodySize - this._bodyBytesWritten
  var end = bytesLeft < chunk.length - offset ? offset + bytesLeft : chunk.length

  var drained = this._msg.write(chunk.slice(offset, end))

  this._bodyBytesWritten += chunk.length

  if (this._bodyBytesWritten >= this._bodySize) {
    debug('end of body')
    this._inBody = false
    this._bodyBytesWritten = 0
    this._msg.end()
  }

  if (!drained) {
    debug('back pressure detected in IncomingMessage')
    this._msg._chunk = chunk
    this._msg._end = end
    this._msg._cb = cb
    return 0 // indicate we didn't consume the chunk (yet)
  }

  return end
}

function indexOfBody (buf, start, end) {
  for (var n = start; n < end - 1; n++) {
    if (buf[n] === CR && buf[n + 1] === NL && buf[n + 2] === CR && buf[n + 3] === NL && n <= end - 4) return n + 4
    if (buf[n] === NL && buf[n + 1] === NL) return n + 2
    if (buf[n] === CR && buf[n + 1] === CR) return n + 2 // weird, but the RFC allows it
  }
  return -1
}
