'use strict'

var test = require('tape')
var Encoder = require('../encoder')

test('encode a single response', function (t) {
  t.plan(1)

  var encoder = new Encoder()

  var buffers = []
  encoder.on('data', buffers.push.bind(buffers))

  var res = encoder.response()
  res.setHeader('Foo', 'Bar')
  res.write('a')
  res.end('b')

  setTimeout(function () {
    var data = Buffer.concat(buffers).toString()
    t.equal(data, 'RTSP/1.0 200 OK\r\nFoo: Bar\r\n\r\nab')
  }, 50)
})

test('encode two responses in series', function (t) {
  t.plan(1)

  var encoder = new Encoder()

  var buffers = []
  encoder.on('data', buffers.push.bind(buffers))

  var res = encoder.response()
  res.setHeader('Foo', 'Bar')
  res.end('a')

  res = encoder.response()
  res.end('b')

  setTimeout(function () {
    var data = Buffer.concat(buffers).toString()
    t.equal(data, 'RTSP/1.0 200 OK\r\nFoo: Bar\r\n\r\naRTSP/1.0 200 OK\r\n\r\nb')
  }, 50)
})

test('encode two responses in parallel', function (t) {
  t.plan(1)

  var encoder = new Encoder()

  var buffers = []
  encoder.on('data', buffers.push.bind(buffers))

  var res1 = encoder.response()
  var res2 = encoder.response()
  res1.setHeader('Foo', 'Bar')
  res1.write('a1')
  res2.write('b1')
  res1.write('a2')
  res2.write('b2')
  res2.end()
  res1.end()

  setTimeout(function () {
    var data = Buffer.concat(buffers).toString()
    t.equal(data, 'RTSP/1.0 200 OK\r\nFoo: Bar\r\n\r\na1a2RTSP/1.0 200 OK\r\n\r\nb1b2')
  }, 50)
})
