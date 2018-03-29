import get from './get';
import post from './post';
import formUtils from '@switch-company/form-utils';

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

  if( formUtils.hasFile ){
    if( !params.header ){
      params.header = {};
    }

    params.header[ 'Content-Type' ] = 'multipart/form-data';

    params.data = new FormData( form );
  }
  else {
    params.data = formUtils.toJSON( form );
  }

  return callMethod( form.action, params );
}

export default form;
