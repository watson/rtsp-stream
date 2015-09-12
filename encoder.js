'use strict'

var util = require('util')
var stream = require('readable-stream')
var Response = require('./lib/response')

var Encoder = module.exports = function (opts) {
  if (!(this instanceof Encoder)) return new Encoder(opts)
  stream.Readable.call(this, opts)
  this._responseQueue = []
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

Encoder.prototype._pushQueue = function (res) {
  this._responseQueue.push(res)
  if (this._responseQueue.length > 1) return
  res.once('finish', this._shiftQueue.bind(this))
  res._kick()
}

Encoder.prototype._shiftQueue = function () {
  this._responseQueue.shift()
  if (this._responseQueue.length === 0) return
  this._responseQueue[0].once('finish', this._shiftQueue.bind(this))
  this._responseQueue[0]._kick()
}
