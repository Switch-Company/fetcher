var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

import config from './config';

function createResponse(data, response) {
  var ok = response.ok,
      redirected = response.redirected,
      status = response.status,
      statusText = response.statusText,
      type = response.type,
      url = response.url;

  var headers = {};

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = response.headers.entries()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _ref = _step.value;

      var _ref2 = _slicedToArray(_ref, 2);

      var name = _ref2[0];
      var value = _ref2[1];

      headers[name] = value;
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return {
    headers: headers,
    ok: ok,
    redirected: redirected,
    status: status,
    statusText: statusText,
    type: type,
    url: url,
    data: data
  };
}

/**
 * do the fetch call
 * @param {string} url - url to fetch
 * @param {object} params - fetch paramerters object
 * @return {Promise} Promise object containing the formated response
 */
function fetch(url) {
  var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var shouldParse = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

  // merge params
  params = Object.assign({}, config.options, params);

  if (!params.headers) {
    params.headers = {};
  }

  // merge headers
  params.headers = Object.assign({}, config.headers, params.headers);

  // create a promise that can be rejected by the timeout
  return new Promise(function (resolve, reject) {
    var rejected = false;
    // fail when theres a timeout or not internet connection
    var browserReject = function browserReject(error) {
      rejected = true;

      reject({
        status: error ? 0 : 599,
        statusText: error ? error.message : 'Network Connect Timeout Error',
        url: url
      });
    };

    var timeout = window.setTimeout(browserReject, config.timeout);

    // fetch the url and resolve or reject the current promise based on its resolution
    window.fetch(url, params).then(function (res) {
      if (rejected) {
        return;
      }

      resolve(res);
    }).catch(browserReject).then(function () {
      window.clearTimeout(timeout);
    });
  })
  // check validity of the response
  .then(function (response) {
    return pass(response, params, shouldParse);
  });
}

/**
 * check respone allow the use of `then` and `catch` based on the value of the success key
 * @param {object} response - fetch response object
 * @param {object} params - param object used to trigger the call
 * @return {Promise} Promise object containing the formated response
 */
function pass(response, params, shouldParse) {
  if (!shouldParse) {
    return response;
  }

  var contentType = response.headers.get('content-type');
  var parsing = void 0;

  if (contentType) {
    contentType = contentType.split(';')[0];
  }

  switch (contentType) {
    case 'application/json':
      parsing = response.json();
      break;
    case 'multipart/form-data':
      parsing = response.formData();
      break;
    case 'application/octet-stream':
      parsing = response.blob();
      break;
    default:
      parsing = response.text();
  }

  return parsing.then(function (data) {
    var formatedResponse = createResponse(data, response);

    if (!response.ok) {
      return Promise.reject(formatedResponse);
    }

    return formatedResponse;
  });
}

export default fetch;