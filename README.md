# Switch - Fetcher

Wrap the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) with convenience methods.

---

Methods `get`, `send`, `form` returns a promise that will resolve or reject with an object containing the data of the response when possible.

The structure of the response's object uses the same structure  the [response interface](https://developer.mozilla.org/en-US/docs/Web/API/Response) properties of a fetch request.

Structure of a fetch response object:

```js
{
    data,
    headers,
    ok,
    redirected,
    status,
    statusText,
    type,
    url
  }
```

The `headers` entry returns an object containing the headers received by the server. You can access them by using their names like `headers[ 'content-type' ]`. Headers are in lowercase.

Depending of the response's `Content-Type` header the data structure of returned value will be different:

* `application/json` - a `JSON` object
* `multipart/form-data` - a `FormData` object
* `application/octet-stream` - a `Blob`

Any other `Content-Type`  will be returned as a [`USVString`](https://developer.mozilla.org/en-US/docs/Web/API/USVString)

Unlike the Fetch API, when [`Response.ok`](https://developer.mozilla.org/en-US/docs/Web/API/Response#Properties) is falsy the returned promise is rejected, allowing you to catch and treat differently the error cases.

Example of 404 rejection:

```js
{
  headers: {
    "content-type": "text/plain"
  },
  redirected: false,
  ok : false,
  status: 404,
  statusText: "Not Found",
  type: "basic",
  url: "https://localhost:3000/fetch"
}
```

If the fetch request times out or the fetched url is unavailable the returned object will only contain `status`, `statusText` and `url` since the server is not involved in the request.

When the request times out the status code will be `599` otherwise it will be `0`.

## Parameters

Default parameters can be changed using `fetch.config = {}`;

### Default parameters

* `headers` - default headers to send. Any headers set when making a request will overide the default headers
* `params` - standard [fetch api request properties](https://developer.mozilla.org/en-US/docs/Web/API/Request#Properties) minus the `header` entry - defaults to `{ credentials: 'same-origin' }`
* `timeout` - duration in milliseconds before the request is considered timed out - defaults to `30000`


## Methods

### `.get( url, parameters, fetchOptions )`

Execute a `GET` request to the `url` using the `parameters` provided.

#### Parameters

Parameters are any parameter provided by the [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Request#Properties).

A `data` object is avalaible to pass the query string.

#### fetchOptions

Fetcher specific options for the current request (optional).

* `parse` - if `false`, the request will not be parsed by fetcher and will return the fetch [response object](https://developer.mozilla.org/en-US/docs/Web/API/Response) (defaults to `true`)
* `timeout` - specific timeout for the current request (in milliseconds)


#### Creating a `GET` fetch

```js
// create a 'GET' request to "/search?term=fetch"
fetchy.get( '/search', {
  data: {
    term: 'fetch'
  }
});
```

### `.send( url, parameters, fetchOptions )`

Send data to the `url` using the `parameters` provided. Method defaults to `POST`.

#### Parameters

Parameters are any parameter provided by the [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Request#Properties).

A `data` object is avalaible to pass a `JSON`, a `Blob` or a [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) object.

In order to `POST` a `FormData` object, the request's `Content-Type` must be set to `multipart/form-data`.

#### fetchOptions

Fetcher specific options for the current request (optional).

* `parse` - if `false`, the request will not be parsed by fetcher and will return the fetch [response object](https://developer.mozilla.org/en-US/docs/Web/API/Response) (defaults to `true`)
* `timeout` - specific timeout for the current request (in milliseconds)

### `.form( HTMLFormElement, parameters, fetchOptions )`

Shortcut to create a fetch request based on a form element. The request endpoint and method are based on the form's `action` and `method` attributes. Entries in the parameters object overwrite the form's attribute when fetching.

Non-strings fields value will be ignored when the from's method is set to `GET`.

A `FormData` object will be sent only when a non-string field value is found. By default the form's data object is a `JSON` object.

#### Parameters

Parameters are any parameter provided by the [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Request#Properties).

#### fetchOptions

Fetcher specific options for the current request (optional).

* `parse` - if `false`, the request will not be parsed by fetcher and will return the fetch [response object](https://developer.mozilla.org/en-US/docs/Web/API/Response) (defaults to `true`)
* `timeout` - specific timeout for the current request (in milliseconds)
