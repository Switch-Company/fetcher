/**
 * @switch-company/fetcher - Wrap the Fetch API with convenience methods.
 * @version v1.0.0
 * @link undefined
 * @license ISC
 **/

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.fetcher = factory());
}(this, (function () { 'use strict';

  var config = {
    headers: {
      'X-Requested-With': 'XMLHttpRequest'
    },
    options: {
      credentials: 'same-origin'
    },
    timeout: 30000
  };

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

  /**
   * POST
   * @param {string} url -the url to fetch
   * @param {object} params - the fetch API param object
   * @return {promise} the fetch promise
   */
  function post(url) {
    var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var multipart = params.header && params.header['Content-Type'] === 'multipart/form-data';

    // merge params
    params = Object.assign({}, {
      method: 'post'
    }, params);

    if (!params.data) {
      params.data = {};
    }

    // stringify the JSON data if the data is not multipart
    params.body = multipart ? params.data : JSON.stringify(params.data);

    delete params.data;

    return fetch(url, params);
  }

  function toJSON( form, stringOnly = false ){
    const data = new FormData( form );
    const json = {};

    for( let [ name, value ] of data ){

      if( stringOnly && typeof value !== 'string' ){
        continue;
      }

      // don't store empty file inputs
      if( value.constructor.name === 'File' && value.size === 0 ){
        continue;
      }

      if( json[ name ]){
        // push the value
        if( Array.isArray( json[ name ])){
          json[ name ].push( value );

          continue;
        }

        // transform into an array
        json[ name ] = [ json[ name ], value ];

        continue;
      }

      // create pair
      json[ name ] = value;
    }

    return json;
  }

  const escape$1 = window.encodeURIComponent;

  function toQuery( form ) {
    const params = toJSON( form, true );

    return Object.keys( params ).map( key => {
      if( Array.isArray( params[ key ])){
        return params[ key ].map( value => {
          return `${escape$1( key )}=${escape$1( value )}`;
        }).join( '&' );
      }

      return `${escape$1( key )}=${escape$1( params[ key ])}`;
    })
      .join( '&' );
  }

  function hasFile( form ){
    const elements = Array.from( form.elements );

    return elements.some( element => {
      return element.type === 'file' && element.files.length > 0;
    });
  }

  var formUtils = { toJSON, toQuery, hasFile };

  /**
   * Get the form data and use fetch based on the action and method attributes
   * @param {HTMLFormElement} form - the form to submit asynchronously
   */
  function form(form) {
    var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var callMethod = post;

    if (!params.method) {
      form.method = form.method;
    }

    if (params.method === 'get') {
      callMethod = get;
    }

    if (formUtils.hasFile) {
      if (!params.header) {
        params.header = {};
      }

      params.header['Content-Type'] = 'multipart/form-data';

      params.data = new FormData(form);
    } else {
      params.data = formUtils.toJSON(form);
    }

    return callMethod(form.action, params);
  }

  var index = { get: get, post: post, form: form, config: config };

  return index;

})));
