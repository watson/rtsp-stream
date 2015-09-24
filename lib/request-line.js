'use strict'

var util = require('util')

var regexp = /^([A-Z_]+) ([^ ]+) RTSP\/(\d\.\d)[\r\n]*$/

// Format:
//   Method SP Request-URI SP HTTP-Version CRLF
// Example:
//   OPTIONS rtsp://example.com/media.mp4 RTSP/1.0
exports.parse = function (line) {
  var match = line.match(regexp)
  if (!match) throw new Error('Invalid RTSP Request-Line: ' + util.inspect(line))
  return {
    method: match[1],
    uri: match[2],
    rtspVersion: match[3]
  }
}
