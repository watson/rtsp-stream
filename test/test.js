'use strict'

var test = require('tape')
var Decoder = require('../decoder')
var Encoder = require('../encoder')

test('encoder.pipe(decoder)', function (t) {
  t.plan(5)

  var decoder = new Decoder()
  var encoder = new Encoder()

  decoder.on('request', function (req) {
    t.ok(false)
  })

  decoder.on('response', function (res) {
    t.equal(res.rtspVersion, '1.0')
    t.equal(res.statusCode, 200)
    t.equal(res.statusMessage, 'OK')
    t.deepEqual(res.headers, { 'cseq': '42', 'foo': 'Bar', 'content-length': '12' })

    var buffers = []
    res.on('data', buffers.push.bind(buffers))
    res.on('end', function () {
      var data = Buffer.concat(buffers).toString()
      t.equal(data, 'Hello World!')
    })
  })

  encoder.pipe(decoder)

  var res = encoder.response()
  res.setHeader('CSeq', 42)
  res.setHeader('Foo', 'Bar')
  res.setHeader('Content-Length', 12)
  res.write('Hello World!')
})
