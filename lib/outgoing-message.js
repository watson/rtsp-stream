'use strict'

var util = require('util')
var stream = require('readable-stream')
var debug = require('./debug')

var OutgoingMessage = module.exports = function (encoder, opts) {
  if (!(this instanceof OutgoingMessage)) return new OutgoingMessage(encoder, opts)

  stream.Writable.call(this, opts)

  this.headersSent = false
  this._encoder = encoder
  this._headers = {}

  this.on('finish', function () {
    if (!this.headersSent) this.writeHead() // must be implemented by descendants
  })
}

util.inherits(OutgoingMessage, stream.Writable)

OutgoingMessage.prototype._write = function (chunk, encoding, cb) {
  if (this._active) {
    if (!this.headersSent) this.writeHead() // must be implemented by descendants
    this._encoder._push(chunk, encoding, cb)
  } else {
    this._bufChunk = chunk
    this._bufEncoding = encoding
    this._bufCallback = cb
  }
}

OutgoingMessage.prototype._kick = function () {
  this._active = true
  if (!this._bufChunk) return
  var chunk = this._bufChunk
  var encoding = this._bufEncoding
  var cb = this._bufCallback
  this._bufChunk = null
  this._bufEncoding = null
  this._bufCallback = null
  this._write(chunk, encoding, cb)
}

OutgoingMessage.prototype.setHeader = function (name, value) {
  if (this.headersSent) throw new Error('Headers already sent!')
  this._headers[name.toLowerCase()] = [name, value]
}

OutgoingMessage.prototype.getHeader = function (name) {
  var header = this._headers[name.toLowerCase()]
  return header ? header[1] : undefined
}

OutgoingMessage.prototype.removeHeader = function (name) {
  if (this.headersSent) throw new Error('Headers already sent!')
  delete this._headers[name.toLowerCase()]
}

OutgoingMessage.prototype._writeHead = function (startLine, headers) {
  var self = this

  if (this.headersSent) throw new Error('Headers already sent!')

  if (headers) {
    Object.keys(headers).forEach(function (name) {
      self.setHeader(name, headers[name])
    })
  }

  this._encoder.push(startLine, 'utf8')
  debug('start-line sent', startLine.trim())

  var debugHeaders = {}
  Object.keys(this._headers).forEach(function (key) {
    var header = self._headers[key]
    var name = header[0]
    var value = header[1]
    debugHeaders[name] = value
    if (!Array.isArray(value)) value = [value]
    value.forEach(function (value) {
      self._encoder.push(util.format('%s: %s\r\n', name, value), 'utf8')
    })
  })

  this._encoder.push('\r\n', 'utf8')
  debug('headers sent', debugHeaders)

  this.headersSent = true
}
