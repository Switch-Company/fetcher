import config from './config';

/**
 * do the fetch call
 * @param {string} url - url to fetch
 * @param {object} params - fetch paramerters object
 * @return {Promise} Promise object containing the formated response
 */
function fetch( url, params = {}){
  // merge params
  params = Object.assign({}, config.options, params );

  if( !params.headers ){
    params.headers = {};
  }

  // merge headers
  params.headers = Object.assign({}, config.headers, params.headers );

  // create a promise that can be rejected by the timeout
  return new Promise(( resolve, reject ) => {
    // fail when theres a timeout or not internet connection
    const browserReject = function() {
      reject({
        status: 599,
        statusText: 'Network Connect Timeout Error'
      });
    };

    const timeout = window.setTimeout( browserReject, config.timeout );

    // fetch the url and resolve or reject the current promise based on its resolution
    window.fetch( url, params )
      .then( res => {
        resolve( res );
      })
      .catch( browserReject )
      .then(() => {
        window.clearTimeout( timeout );
      });
  })
    // check validity of the response
    .then( response => pass( response, params ));
}


/**
 * check respone allow the use of `then` and `catch` based on the value of the success key
 * @param {object} response - fetch response object
 * @param {object} params - param object used to trigger the call
 * @return {Promise} Promise object containing the formated response
 */
function pass( response ) {
  const contentType = response.headers.get( 'content-type' );

  if( contentType.includes( 'application/json' )){
    return response.json()
      .then( data => {
        if( !response.ok ){
          return Promise.reject( data );
        }

        return data;
      });
  }

  if( contentType.includes( 'multipart/form-data' )){
    return response.formData()
      .then( data => {
        if( !response.ok ){
          return Promise.reject( data );
        }

        return data;
      });
  }

  if( contentType.includes( 'application/octet-stream' )){
    return response.blob()
      .then( data => {
        if( !response.ok ){
          return Promise.reject( data );
        }

        return data;
      });
  }

  if( response.ok ){
    return response.text();
  }

  return Promise.reject({
    status: response.status,
    statusText: response.statusText
  });
}

export default fetch;
