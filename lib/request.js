'use strict'

var util = require('util')
var OutgoingMessage = require('./outgoing-message')

var Request = module.exports = function (encoder, opts, streamOpts) {
  if (!(this instanceof Request)) return new Request(encoder, opts, streamOpts)

  OutgoingMessage.call(this, encoder, streamOpts)

  this.method = opts.method
  this.uri = opts.uri

  var self = this
  if (opts.headers) {
    Object.keys(opts.headers).forEach(function (name) {
      self.setHeader(name, opts.headers[name])
    })
  }

  if (opts.body) {
    this.write(opts.body)
    process.nextTick(this.end.bind(this))
  }
}

util.inherits(Request, OutgoingMessage)

Request.prototype.writeHead = function () {
  if (this.headersSent) throw new Error('Headers already sent!')
  var requestLine = util.format('%s %s RTSP/1.0\r\n', this.method, this.uri)
  this._writeHead(requestLine)
}
