var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

import fetch from './fetch';

/**
 * SEND
 * @param {string} url -the url to fetch
 * @param {object} params - the fetch API param object
 * @return {promise} the fetch promise
 */
function send(url) {
  var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var shouldParse = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

  // const multipart = params.headers && params.headers[ 'Content-Type' ] && params.headers[ 'Content-Type' ].toLowerCase().indexOf( 'multipart/form-data' ) > -1;

  var currentContentType = void 0;
  var format = true;

  if (params.headers) {
    Object.keys(params.headers).some(function (header) {
      var headerName = header.toLowerCase();

      if (headerName !== 'content-type') {
        return;
      }

      currentContentType = params.headers[header].toLowerCase().split(';')[0];

      // multipart = contentType === 'multipart/form-data';
      // json = contentType === 'application/json';

      return true;
    });
  } else {
    params.headers = {};
  }

  if (currentContentType === 'multipart/form-data' || currentContentType === 'application/octet-stream') {
    format = false;
  }

  if (format && params.data) {
    if ('append' in params.data.__proto__ || 'type' in params.data.__proto__) {
      format = false;

      if (params.data.type && !currentContentType) {
        params.headers['content-type'] = params.data.type;
      }
    } else if (!currentContentType && _typeof(params.data) === 'object') {
      params.headers['content-type'] = 'application/json;charset=UTF-8';
    }
  }

  // merge params
  params = Object.assign({}, {
    // default to post
    method: 'post'
  }, params);

  if (params.data) {
    // stringify the JSON data if the data is not multipart
    params.body = format ? JSON.stringify(params.data) : params.data;
    delete params.data;
  }

  return fetch(url, params, shouldParse);
}

export default send;