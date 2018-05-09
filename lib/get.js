import fetch from './fetch';

var escape = window.encodeURIComponent;

function queryfy(params) {
  return Object.keys(params).map(function (key) {
    if (Array.isArray(params[key])) {
      return params[key].map(function (value) {
        return escape(key) + '=' + escape(value);
      }).join('&');
    }

    return escape(key) + '=' + escape(params[key]);
  }).join('&');
}

/**
 * GET
 * @param {string} url -the url to fetch
 * @param {object} params - the fetch API param object
 * @return {promise} the fetch promise
 */
function get(url) {
  var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};


  params.method = 'get';

  if (params.data) {
    var search = url.split['?'][1];

    if (search) {
      url += '&' + queryfy(params.data);
    } else {
      url += '?' + queryfy(params.data);
    }

    delete params.data;
  }

  return fetch(url, params);
}

export default get;