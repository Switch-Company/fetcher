import fetch from './fetch';

/**
 * POST
 * @param {string} url -the url to fetch
 * @param {object} params - the fetch API param object
 * @return {promise} the fetch promise
 */
function post( url, params = {}){
  const multipart = params.header && params.header[ 'Content-Type' ] === 'multipart/form-data';

  // merge params
  params = Object.assign({}, {
    method: 'post'
  }, params );

  if ( !params.data ) {
    params.data = {};
  }

  // stringify the JSON data if the data is not multipart
  params.body = multipart ? params.data : JSON.stringify( params.data );

  delete params.data;

  return fetch( url, params );
}

export default post;
