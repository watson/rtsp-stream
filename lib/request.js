'use strict'

var util = require('util')
var stream = require('readable-stream')
var nextLine = require('next-line')
var httpHeaders = require('http-headers')
var requestLine = require('./request-line')

var Request = module.exports = function (head, opts) {
  if (!(this instanceof Request)) return new Request(head, opts)

  stream.PassThrough.call(this, opts)

  var line = requestLine.parse(nextLine(head)())
  this.rtspVersion = line.rtspVersion
  this.method = line.method
  this.uri = line.uri
  this.headers = httpHeaders(head)
}

util.inherits(Request, stream.PassThrough)
