'use strict'

var util = require('util')
var stream = require('readable-stream')
var Response = require('./lib/response')
var Request = require('./lib/request')

var Encoder = module.exports = function (opts) {
  if (!(this instanceof Encoder)) return new Encoder(opts)
  stream.Readable.call(this, opts)
  this._messageQueue = []
}

util.inherits(Encoder, stream.Readable)

Encoder.prototype._read = function (size) {
  if (this._drainedCallback) {
    var cb = this._drainedCallback
    this._drainedCallback = null
    cb()
  }
}

Encoder.prototype._push = function (chunk, encoding, cb) {
  var drained = this.push(chunk, encoding)
  if (drained) return cb()
  this._drainedCallback = cb
}

// Build a new response. We have to take extra care if more than one
// response is active at the same time. In that case, the order in which
// the responses was created should be the same as the order of which
// their data is emitted from the encoder stream. Also, data from one
// response must not be mixed with data from another response.
Encoder.prototype.response = function () {
  var res = new Response(this)
  this._pushQueue(res)
  return res
}

// Options:
// - method
// - uri
// - headers (optional)
// - body (optional)
Encoder.prototype.request = function (opts, cb) {
  var req = new Request(this, opts)
  if (cb) req.on('finish', cb)
  this._pushQueue(req)
  return req
}

Encoder.prototype._pushQueue = function (msg) {
  this._messageQueue.push(msg)
  if (this._messageQueue.length > 1) return
  msg.once('finish', this._shiftQueue.bind(this))
  msg._kick()
}

Encoder.prototype._shiftQueue = function () {
  this._messageQueue.shift()
  if (this._messageQueue.length === 0) return
  this._messageQueue[0].once('finish', this._shiftQueue.bind(this))
  this._messageQueue[0]._kick()
}
