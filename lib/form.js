import get from './get';
import send from './send';
import formUtils from '@switch-company/form-utils';

/**
 * Get the form data and use fetch based on the action and method attributes
 * @param {HTMLFormElement} form - the form to submit asynchronously
 * @param {object} params - the fetch API param object
 * @param {object} options - one time configuration of the fetch request
 * @return {Promise} Promise object containing the formated response
 */
function form( form, params = {}, options = {}){
  let callMethod = send;
  const contentType = form.enctype;

  if( form.method && !params.method ){
    params.method = form.method;
  }

  if( contentType && !params.header ){
    params.header[ 'Content-Type' ] = contentType;
  }

  if( params.method === 'get' ){
    callMethod = get;
  }

  if( formUtils.hasFile( form )){
    if( !params.header ){
      params.header = {};
    }

    params.header[ 'Content-Type' ] = 'multipart/form-data';

    params.data = new FormData( form );
  }
  else {
    params.data = formUtils.toJSON( form );
  }

  return callMethod( form.action, params, options );
}

export default form;
