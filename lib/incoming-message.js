'use strict'

var util = require('util')
var stream = require('readable-stream')
var nextLine = require('next-line')
var httpHeaders = require('http-headers')
var requestLine = require('./request-line')
var statusLine = require('./status-line')

var STATUS_LINE_START = new Buffer('RTSP/1.0')

var IncomingMessage = module.exports = function (head, opts) {
  if (!(this instanceof IncomingMessage)) return new IncomingMessage(head, opts)

  stream.PassThrough.call(this, opts)

  if (typeof head === 'string') head = new Buffer(head)

  var line = nextLine(head)()

  if (isResponse(head)) {
    line = statusLine.parse(line)
    this.statusCode = line.statusCode
    this.statusMessage = line.statusMessage
  } else {
    line = requestLine.parse(line)
    this.method = line.method
    this.uri = line.uri
  }

  this.rtspVersion = line.rtspVersion
  this.headers = httpHeaders(head)
}

util.inherits(IncomingMessage, stream.PassThrough)

function isResponse (head) {
  for (var i = 0; i < 8; i++) {
    if (STATUS_LINE_START[i] !== head[i]) return false
  }
  return true
}
