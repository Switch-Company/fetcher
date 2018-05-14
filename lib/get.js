import fetch from './fetch';

const escape = window.encodeURIComponent;

function queryfy( params ) {
  return Object.keys( params ).map( key => {
    if( Array.isArray( params[ key ])){
      return params[ key ].map( value => {
        return `${escape( key )}=${escape( value )}`;
      }).join( '&' );
    }

    return `${escape( key )}=${escape( params[ key ])}`;
  })
    .join( '&' );
}

/**
 * GET
 * @param {string} url -the url to fetch
 * @param {object} params - the fetch API param object
 * @param {object} options - one time configuration of the fetch request
 * @return {promise} the fetch promise
 */
function get( url, params = {}, options = {}){

  params.method = 'get';

  if( params.data ){
    const search = url.split( '?' )[ 1 ];

    if( search ){
      url += `&${queryfy( params.data )}`;
    }
    else {
      url += `?${queryfy( params.data )}`;
    }

    delete params.data;
  }

  return fetch( url, params, options );
}

export default get;
