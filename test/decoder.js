'use strict'

var fs = require('fs')
var path = require('path')
var choppa = require('choppa')
var test = require('tape')
var Decoder = require('../decoder')

var pipes = [choppa, null]

pipes.forEach(function (pipe) {
  test('request headers', function (t) {
    t.plan(4)

    var stream = fs.createReadStream(path.resolve('test', 'fixtures', 'options.txt'))
    var decoder = new Decoder()

    decoder.on('request', function (req) {
      t.equal(req.method, 'OPTIONS')
      t.equal(req.uri, '*')
      t.equal(req.rtspVersion, '1.0')
      t.deepEqual(req.headers, { 'cseq': '42', 'foo': 'Bar' })
    })

    if (pipe) stream = stream.pipe(pipe())
    stream.pipe(decoder)
  })

  test('request body', function (t) {
    t.plan(1)

    var stream = fs.createReadStream(path.resolve('test', 'fixtures', 'announce.txt'))
    var decoder = new Decoder()

    decoder.on('request', function (req) {
      var buffers = []
      req.on('data', buffers.push.bind(buffers))
      req.on('end', function () {
        var data = Buffer.concat(buffers).toString()
        t.equal(data, '1234567890')
      })
    })

    if (pipe) stream = stream.pipe(pipe())
    stream.pipe(decoder)
  })

  test('multiple request bodies', function (t) {
    var requests = 0
    var stream = fs.createReadStream(path.resolve('test', 'fixtures', 'multiple.txt'))
    var decoder = new Decoder()
    var expected = [
      '1st request',
      'last request'
    ]

    decoder.on('request', function (req) {
      var requestNumber = ++requests
      t.equal(req.headers['cseq'], String(requestNumber))
      var buffers = []
      req.on('data', buffers.push.bind(buffers))
      req.on('end', function () {
        var data = Buffer.concat(buffers).toString()
        t.equal(data, expected[requestNumber - 1])
      })
    })

    decoder.on('finish', function () {
      t.equal(requests, 2)
      t.end()
    })

    if (pipe) stream = stream.pipe(pipe())
    stream.pipe(decoder)
  })
})
