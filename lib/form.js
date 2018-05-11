import get from './get';
import send from './send';
import formUtils from '@switch-company/form-utils';

/**
 * Get the form data and use fetch based on the action and method attributes
 * @param {HTMLFormElement} form - the form to submit asynchronously
 */
function form(form) {
  var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var shouldParse = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

  var callMethod = send;

  if (!params.method) {
    form.method = form.method;
  }

  if (params.method === 'get') {
    callMethod = get;
  }

  if (formUtils.hasFile(form)) {
    if (!params.header) {
      params.header = {};
    }

    params.header['Content-Type'] = 'multipart/form-data';

    params.data = new FormData(form);
  } else {
    params.data = formUtils.toJSON(form);
  }

  return callMethod(form.action, params, shouldParse);
}

export default form;