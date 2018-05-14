import config from './config';

/**
 * create a custom response object based on the fetch response object
 * @param {*} data - data parsed by the pass method
 * @param {object} response - fetch response object
 * @return {object} custom response object
 */
function createResponse( data, response ){
  const { ok, redirected, status, statusText, type, url } = response;
  const headers = {};

  for( const [ name, value ] of response.headers.entries()){
    headers[ name ] = value;
  }

  return {
    headers,
    ok,
    redirected,
    status,
    statusText,
    type,
    url,
    data
  };
}

/**
 * do the fetch call
 * @param {string} url - url to fetch
 * @param {object} params - fetch paramerters object
 * @param {object} options - one time configuration of the fetch request
 * @return {Promise} Promise object containing the formated response
 */
function fetch( url, params = {}, options = {}){
  // merge params
  params = Object.assign({}, config.params, params );

  if( !params.headers ){
    params.headers = {};
  }

  // merge headers
  params.headers = Object.assign({}, config.headers, params.headers );

  // create a promise that can be rejected by the timeout
  return new Promise(( resolve, reject ) => {
    let rejected = false;
    // fail when theres a timeout or not internet connection
    const browserReject = error => {
      rejected = true;

      reject({
        status: error ? 0 : 599,
        statusText: error ? error.message : 'Network Connect Timeout Error',
        url
      });
    };

    const timeout = window.setTimeout( browserReject, options.timeout || config.timeout );

    // fetch the url and resolve or reject the current promise based on its resolution
    window.fetch( url, params )
      .then( res => {
        if( rejected ){
          return;
        }

        resolve( res );
      })
      .catch( browserReject )
      .then(() => {
        window.clearTimeout( timeout );
      });
  })
    // check validity of the response
    .then( response => pass( response, params, options.parse ));
}


/**
 * check respone allow the use of `then` and `catch` based on the value of the success key
 * @param {object} response - fetch response object
 * @param {object} params - param object used to trigger the call
 * @return {Promise} Promise object containing the formated response
 */
function pass( response, params, shouldParse = true ) {
  if( !shouldParse ){
    return response;
  }

  let contentType = response.headers.get( 'content-type' );
  let parsing;

  if( contentType ){
    contentType = contentType.split( ';' )[ 0 ];
  }

  switch( contentType ){
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

  return parsing
    .then( data => {
      const formatedResponse = createResponse( data, response );

      if( !response.ok ){
        return Promise.reject( formatedResponse );
      }

      return formatedResponse;
    });
}

export default fetch;
