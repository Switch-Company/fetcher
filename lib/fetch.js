import config from './config';

/**
 * do the fetch call
 * @param {string} url - url to fetch
 * @param {object} params - fetch paramerters object
 * @return {Promise} Promise object containing the formated response
 */
function fetch(url) {
  var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  // merge params
  params = Object.assign({}, config.params, params);

  if (!params.headers) {
    params.headers = {};
  }

  // merge headers
  params.headers = Object.assign({}, config.headers, params.headers);

  // create a promise that can be rejected by the timeout
  return new Promise(function (resolve, reject) {
    // fail when theres a timeout or not internet connection
    var browserReject = function browserReject() {
      reject({
        status: 599,
        statusText: 'Network Connect Timeout Error'
      });
    };

    var timeout = window.setTimeout(browserReject, config.timeout);

    // fetch the url and resolve or reject the current promise based on its resolution
    window.fetch(url, params).then(function (res) {
      resolve(res);
    }).catch(browserReject).then(function () {
      window.clearTimeout(timeout);
    });
  })
  // check validity of the response
  .then(function (response) {
    return pass(response, params);
  });
}

/**
 * check respone allow the use of `then` and `catch` based on the value of the success key
 * @param {object} response - fetch response object
 * @param {object} params - param object used to trigger the call
 * @return {Promise} Promise object containing the formated response
 */
function pass(response) {
  var contentType = response.headers.get('content-type');

  if (contentType.includes('application/json')) {
    return response.json().then(function (data) {
      if (!response.ok) {
        return Promise.reject(data);
      }

      return data;
    });
  }

  if (contentType.includes('multipart/form-data')) {
    return response.formData().then(function (data) {
      if (!response.ok) {
        return Promise.reject(data);
      }

      return data;
    });
  }

  if (contentType.includes('application/octet-stream')) {
    return response.blob().then(function (data) {
      if (!response.ok) {
        return Promise.reject(data);
      }

      return data;
    });
  }

  if (response.ok) {
    return response.text();
  }

  return Promise.reject({
    status: response.status,
    statusText: response.statusText
  });
}

export default fetch;