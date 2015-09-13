'use strict'

var util = require('util')
var OutgoingMessage = require('./outgoing-message')
var STATUS_CODES = require('./status-codes')

var Response = module.exports = function (encoder, opts) {
  if (!(this instanceof Response)) return new Response(encoder, opts)

  OutgoingMessage.call(this, encoder, opts)

  this.statusCode = 200
}

util.inherits(Response, OutgoingMessage)

Response.prototype.writeHead = function (statusCode, statusMessage, headers) {
  if (this.headersSent) throw new Error('Headers already sent!')

  if (typeof statusMessage === 'object') {
    headers = statusMessage
    statusMessage = null
  }

  if (statusCode) this.statusCode = statusCode
  this.statusMessage = statusMessage || this.statusMessage || STATUS_CODES[String(this.statusCode)]
  var statusLine = util.format('RTSP/1.0 %s %s\r\n', this.statusCode, this.statusMessage)

  this._writeHead(statusLine, headers)
}
