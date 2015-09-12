'use strict'

var test = require('tape')
var Request = require('../lib/request')

var heads = [
  'OPTIONS * RTSP/1.0\r\nCSeq: 42\r\nFoo: Bar\r\n\r\n',
  'OPTIONS * RTSP/1.0\nCSeq: 42\nFoo: Bar\n\n',
  'OPTIONS * RTSP/1.0\rCSeq: 42\rFoo: Bar\r\r'
]

heads.forEach(function (head, index) {
  test('request headers type ' + (index + 1), function (t) {
    var req = new Request(head)
    t.equal(req.rtspVersion, '1.0')
    t.equal(req.method, 'OPTIONS')
    t.equal(req.url, '*')
    t.deepEqual(req.headers, { cseq: '42', foo: 'Bar' })
    t.end()
  })
})

test('request body', function (t) {
  t.plan(1)
  var req = new Request(heads[0])
  var buffers = []
  req.on('data', buffers.push.bind(buffers))
  req.on('end', function () {
    var data = Buffer.concat(buffers).toString()
    t.equal(data, 'foo')
  })
  req.end('foo')
})
