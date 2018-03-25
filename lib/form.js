import get from './get';
import post from './post';

/**
 * Get the form data and use fetch based on the action and method attributes
 * @param {HTMLFormElement} form - the form to submit asynchronously
 */
function form( form, params = {}){
  let callMethod = post;

  if( !params.method ){
    form.method = form.method;
  }

  if( params.method === 'get' ){
    callMethod = get;
  }

  const [ data, multipart ] = getData( form );

  params.data = data;

  if( multipart ){
    if( !params.header ){
      params.header = {};
    }

    params.header[ 'Content-Type' ] = 'multipart/form-data';
  }

  return callMethod( form.action, params );
}

function getData( form ){
  const data = new FormData( form );
  const json = {};
  let multipart = false;

  for( let [ name, value ] of data ){
    // console.log( name, value, value.type, typeof value !== 'string' );
    // file object
    if( typeof value !== 'string' ){

      // skip the file object if the form's method is a post
      if( form.method === 'get' || value.size === 0 ){
        continue;
      }
      multipart = true;

      // don't convert the formData if it contains a file object
      break;
    }

    if( json[ name ]){
      // push the value
      if( Array.isArray( json[ name ])){
        json[ name ].push( value );
      }
      // transform ot an array
      json[ name ] = [ json[ name ], value ];

      continue;
    }

    // create pair
    json[ name ] = value;
  }

  return [ multipart ? data : json, multipart ];
}

export default form;
