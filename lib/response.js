'use strict'

var util = require('util')
var stream = require('readable-stream')
var debug = require('./debug')
var STATUS_CODES = require('./status-codes')

var Response = module.exports = function (encoder, opts) {
  if (!(this instanceof Response)) return new Response(encoder, opts)

  stream.Writable.call(this, opts)

  this.statusCode = 200
  this.headersSent = false
  this._encoder = encoder
  this._headers = {}
}

util.inherits(Response, stream.Writable)

Response.prototype._write = function (chunk, encoding, cb) {
  if (this._active) {
    if (!this.headersSent) this.writeHead()
    this._encoder._push(chunk, encoding, cb)
  } else {
    this._bufChunk = chunk
    this._bufEncoding = encoding
    this._bufCallback = cb
  }
}

Response.prototype._kick = function () {
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

Response.prototype.setHeader = function (name, value) {
  if (this.headersSent) throw new Error('Headers already sent!')
  this._headers[name.toLowerCase()] = [name, value]
}

Response.prototype.getHeader = function (name) {
  var header = this._headers[name.toLowerCase()]
  return header ? header[1] : undefined
}

Response.prototype.removeHeader = function (name) {
  if (this.headersSent) throw new Error('Headers already sent!')
  delete this._headers[name.toLowerCase()]
}

Response.prototype.writeHead = function (statusCode, statusMessage, headers) {
  var self = this

  if (this.headersSent) throw new Error('Headers already sent!')
  if (typeof statusMessage === 'object') {
    headers = statusMessage
    statusMessage = null
  }

  if (statusCode) this.statusCode = statusCode
  if (headers) {
    Object.keys(headers).forEach(function (name) {
      self.setHeader(name, headers[name])
    })
  }

  this.statusMessage = statusMessage || this.statusMessage || STATUS_CODES[String(this.statusCode)]

  var statusLine = util.format('RTSP/1.0 %s %s\r\n', this.statusCode, this.statusMessage)
  this._encoder.push(statusLine, 'utf8')
  debug('response status-line sent', statusLine.trim())

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
  debug('response headers sent', debugHeaders)

  this.headersSent = true
}
