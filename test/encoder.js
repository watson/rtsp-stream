'use strict'

var test = require('tape')
var Encoder = require('../encoder')

test('encoder.response()', function (t) {
  t.test('no body or headers', function (t) {
    t.plan(1)

    var encoder = new Encoder()

    var buffers = []
    encoder.on('data', buffers.push.bind(buffers))

    var res = encoder.response()
    res.end()

    setTimeout(function () {
      var data = Buffer.concat(buffers).toString()
      t.equal(data, 'RTSP/1.0 200 OK\r\n\r\n')
    }, 50)
  })

  t.test('no body - only headers', function (t) {
    t.plan(1)

    var encoder = new Encoder()

    var buffers = []
    encoder.on('data', buffers.push.bind(buffers))

    var res = encoder.response()
    res.setHeader('Foo', 'Bar')
    res.end()

    setTimeout(function () {
      var data = Buffer.concat(buffers).toString()
      t.equal(data, 'RTSP/1.0 200 OK\r\nFoo: Bar\r\n\r\n')
    }, 50)
  })

  t.test('encode a single response', function (t) {
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

  t.test('encode two responses in series', function (t) {
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

  t.test('encode two responses in parallel', function (t) {
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
})

test('encoder.request()', function (t) {
  t.test('one-line encode a single request using callback', function (t) {
    t.plan(1)

    var encoder = new Encoder()

    var buffers = []
    encoder.on('data', buffers.push.bind(buffers))

    var opts = {
      method: 'OPTIONS',
      uri: '*',
      headers: { 'Foo': 'Bar' },
      body: 'ab'
    }

    encoder.request(opts, function () {
      var data = Buffer.concat(buffers).toString()
      t.equal(data, 'OPTIONS * RTSP/1.0\r\nFoo: Bar\r\n\r\nab')
    })
  })

  t.test('multi-step encode a single request using callback', function (t) {
    t.plan(1)

    var encoder = new Encoder()

    var buffers = []
    encoder.on('data', buffers.push.bind(buffers))

    var opts = {
      method: 'OPTIONS',
      uri: '*',
      headers: { 'Foo': 'Bar' }
    }

    var req = encoder.request(opts, function () {
      var data = Buffer.concat(buffers).toString()
      t.equal(data, 'OPTIONS * RTSP/1.0\r\nFoo: Bar\r\n\r\nab')
    })

    req.write('a')
    req.end('b')
  })

  t.test('one-line encode a single request without callback', function (t) {
    t.plan(1)

    var encoder = new Encoder()

    var buffers = []
    encoder.on('data', buffers.push.bind(buffers))

    var opts = {
      method: 'OPTIONS',
      uri: '*',
      headers: { 'Foo': 'Bar' },
      body: 'ab'
    }

    var req = encoder.request(opts)

    req.on('finish', function () {
      var data = Buffer.concat(buffers).toString()
      t.equal(data, 'OPTIONS * RTSP/1.0\r\nFoo: Bar\r\n\r\nab')
    })
  })

  t.test('multi-step encode a single request without callback', function (t) {
    t.plan(1)

    var encoder = new Encoder()

    var buffers = []
    encoder.on('data', buffers.push.bind(buffers))

    var opts = {
      method: 'OPTIONS',
      uri: '*',
      headers: { 'Foo': 'Bar' }
    }

    var req = encoder.request(opts)
    req.write('a')
    req.end('b')

    req.on('finish', function () {
      var data = Buffer.concat(buffers).toString()
      t.equal(data, 'OPTIONS * RTSP/1.0\r\nFoo: Bar\r\n\r\nab')
    })
  })

  t.test('encode two request in series', function (t) {
    t.plan(1)

    var encoder = new Encoder()

    var buffers = []
    encoder.on('data', buffers.push.bind(buffers))

    var req = encoder.request({ method: 'OPTIONS', uri: '*' })
    req.setHeader('Foo', 'Bar')
    req.end('a')

    req = encoder.request({ method: 'OPTIONS', uri: '*' })
    req.end('b')

    setTimeout(function () {
      var data = Buffer.concat(buffers).toString()
      t.equal(data, 'OPTIONS * RTSP/1.0\r\nFoo: Bar\r\n\r\naOPTIONS * RTSP/1.0\r\n\r\nb')
    }, 50)
  })

  t.test('encode two requests in parallel', function (t) {
    t.plan(1)

    var encoder = new Encoder()

    var buffers = []
    encoder.on('data', buffers.push.bind(buffers))

    var req1 = encoder.request({ method: 'OPTIONS', uri: '*' })
    var req2 = encoder.request({ method: 'OPTIONS', uri: '*' })
    req1.setHeader('Foo', 'Bar')
    req1.write('a1')
    req2.write('b1')
    req1.write('a2')
    req2.write('b2')
    req2.end()
    req1.end()

    setTimeout(function () {
      var data = Buffer.concat(buffers).toString()
      t.equal(data, 'OPTIONS * RTSP/1.0\r\nFoo: Bar\r\n\r\na1a2OPTIONS * RTSP/1.0\r\n\r\nb1b2')
    }, 50)
  })
})
