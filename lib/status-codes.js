'use strict'

// Where applicable, HTTP status codes are reused. Custom RTSP status codes
// have been marked as such below
//
// Check RFC 2326 section 11 for details:
// https://tools.ietf.org/html/rfc2326#page-41

module.exports = {
  '100': 'Continue',

  '200': 'OK',
  '201': 'Created',
  '250': 'Low on Storage Space', // RTSP

  '300': 'Multiple Choices',
  '301': 'Moved Permanently',
  '302': 'Moved Temporarily',
  '303': 'See Other',
  '304': 'Not Modified',
  '305': 'Use Proxy',

  '400': 'Bad Request',
  '401': 'Unauthorized',
  '402': 'Payment Required',
  '403': 'Forbidden',
  '404': 'Not Found',
  '405': 'Method Not Allowed',
  '406': 'Not Acceptable',
  '407': 'Proxy Authentication Required',
  '408': 'Request Time-out',
  '410': 'Gone',
  '411': 'Length Required',
  '412': 'Precondition Failed',
  '413': 'Request Entity Too Large',
  '414': 'Request-URI Too Large',
  '415': 'Unsupported Media Type',
  '451': 'Parameter Not Understood', // RTSP
  '452': 'Conference Not Found', // RTSP
  '453': 'Not Enough Bandwidth', // RTSP
  '454': 'Session Not Found', // RTSP
  '455': 'Method Not Valid in This State', // RTSP
  '456': 'Header Field Not Valid for Resource', // RTSP
  '457': 'Invalid Range', // RTSP
  '458': 'Parameter Is Read-Only', // RTSP
  '459': 'Aggregate Operation Not Allowed', // RTSP
  '460': 'Only Aggregate Operation Allowed', // RTSP
  '461': 'Unsupported Transport', // RTSP
  '462': 'Destination Unreachable', // RTSP

  '500': 'Internal Server Error',
  '501': 'Not Implemented',
  '502': 'Bad Gateway',
  '503': 'Service Unavailable',
  '504': 'Gateway Time-out',
  '505': 'HTTP Version Not Supported',
  '551': 'Option not supported' // RTSP
}
