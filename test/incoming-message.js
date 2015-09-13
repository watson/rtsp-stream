'use strict'

var test = require('tape')
var IncomingMessage = require('../lib/incoming-message')

var lineBreaks = ['\r\n', '\n', '\r']
var requestHeadLines = ['OPTIONS * RTSP/1.0', 'CSeq: 42', 'Foo: Bar']
var responseHeadLines = ['RTSP/1.0 200 OK', 'CSeq: 42', 'Foo: Bar']

function head (arr, nl) {
  return new Buffer([].concat(arr, ['', '']).join(nl))
}

lineBreaks.forEach(function (nl, index) {
  test('incoming-message request headers type ' + (index + 1), function (t) {
    var msg = new IncomingMessage(head(requestHeadLines, nl))
    t.equal(msg.rtspVersion, '1.0')
    t.equal(msg.method, 'OPTIONS')
    t.equal(msg.uri, '*')
    t.deepEqual(msg.headers, { cseq: '42', foo: 'Bar' })
    t.end()
  })

  test('incoming-message response headers type ' + (index + 1), function (t) {
    var msg = new IncomingMessage(head(responseHeadLines, nl))
    t.equal(msg.rtspVersion, '1.0')
    t.equal(msg.statusCode, 200)
    t.equal(msg.statusMessage, 'OK')
    t.deepEqual(msg.headers, { cseq: '42', foo: 'Bar' })
    t.end()
  })

  test('incoming-message request body type ' + (index + 1), function (t) {
    t.plan(1)
    var msg = new IncomingMessage(head(requestHeadLines, nl))
    var buffers = []
    msg.on('data', buffers.push.bind(buffers))
    msg.on('end', function () {
      var data = Buffer.concat(buffers).toString()
      t.equal(data, 'foo')
    })
    msg.end('foo')
  })

  test('incoming-message response body type ' + (index + 1), function (t) {
    t.plan(1)
    var msg = new IncomingMessage(head(responseHeadLines, nl))
    var buffers = []
    msg.on('data', buffers.push.bind(buffers))
    msg.on('end', function () {
      var data = Buffer.concat(buffers).toString()
      t.equal(data, 'foo')
    })
    msg.end('foo')
  })
})
