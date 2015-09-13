'use strict'

var util = require('util')

var regexp = /^RTSP\/(\d\.\d) (\d{3}) (.*)[\r\n]*$/

// Format:
//   RTSP-Version SP Status-Code SP Reason-Phrase CRLF
// Example:
//   RTSP/1.0 200 OK
exports.parse = function (line) {
  var match = line.match(regexp)
  if (!match) throw new Error('Invalid RTSP Status-Line: ' + util.inspect(line))
  return {
    rtspVersion: match[1],
    statusCode: parseInt(match[2], 10),
    statusMessage: match[3]
  }
}
