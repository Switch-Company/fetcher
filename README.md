# Switch - Fetchy

Wrap the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) with convenience methods.

---

Methods `get`, `post`, `form` returns a promise that will resolve or reject with the content of the response when possible.

Depending of the response's `Content-Type` header the returned value will be different:

* `application/json` - a `JSON` object
* `multipart/form-data` - a `FormData` object
* `application/octet-stream` - a `Blob`

Any other `Content-Type`  will be returned as a [`USVString`](https://developer.mozilla.org/en-US/docs/Web/API/USVString)

If [`Response.ok`](https://developer.mozilla.org/en-US/docs/Web/API/Response#Properties) is falsy and the `Content-Type` header doesn't match
`applcation/json`, `multipart/form-data` or `application/octet-stream` the promise will reject with a `JSON` object containing `Response.status` and `Response.statusText`.

Example of 404 rejection:

```json
{
  status: 404,
  statusText: 'Not Found'
}
```

If the fetch request times out the `JSON` object will be as follow:

```json
{
  status: 599,
  statusText: 'Network Connect Timeout Error'
}
```

## Parameters

Default parameters can be changed using `fetch.config = {}`;

### Default parameters

* `headers` - default headers to send. Any headers set when making a request will overide the default headers
* `options` - standard [fetch api request properties](https://developer.mozilla.org/en-US/docs/Web/API/Request#Properties) minus the `header` entry - defaults to `{ credentials: 'same-origin' }`
* `timeout` - duration in milliseconds before the request is considered timed out - defaults to `30000`


## Methods

### `.get( url, parameters )`

Execute a `GET` fetch to the `url` using the `parameters` provided.

#### Parameters

Parameters are any parameter provided by the [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Request#Properties).

A `data` object is avalaible to pass the query string.

#### Creating a `GET` fetch

```js
// fetch "/search?term=fetch"
fetchy.get( '/search', {
  data: {
    term: 'fetch'
  }
});
```

### `.post( url, parameters )`

Execute a `POST` fetch to the `url` using the `parameters` provided.

#### Parameters

Parameters are any parameter provided by the [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Request#Properties).

A `data` object is avalaible to pass a `JSON` or a [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) object.

In order to `POST` a `FormData` object, the request's `Content-Type` must be set to `multipart/form-data`.

### `.form( HTMLFormElement, parameters )`

Shortcut to create a fetch request based on a form element. The request endpoint and method are based on the form's `action` and `method` attributes.

Non-strings fields value will be ignored when the from's method is set to `GET`.

A `FormData` object will be send only when a non-string field value is found. By default form's data object is a `JSON`.

#### Parameters

Parameters are any parameter provided by the [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Request#Properties).
