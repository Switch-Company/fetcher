/* eslint-env node */
'use strict';
// require('leaked-handles');

const test = require( 'tape' );
const puppeteer = require( 'puppeteer' );
const http = require( 'http' );
const promisify = require( 'util' ).promisify;
// const inspect = require( 'util' ).inspect;
const Busboy = require( 'busboy' );

const port = '3000';
const url = `http://localhost:${port}/test`;
const path = `file://${__dirname}/index.html`;

const createServer = async ( handler, t ) => {
  const server = http.createServer(( req, res ) => {
    res.setHeader( 'Access-Control-Allow-Origin', '*' );

    if( req.method === 'OPTIONS' ){
      res.setHeader( 'Access-Control-Allow-Headers', '*' );
      res.setHeader( 'Access-Control-Allow-Methods', '*' );
      res.end( '' );

      return;
    }

    t.same( req.url, '/test', 'requested url is valid' );
    handler( req, res );
  });

  server._close = server.close;
  server.close = promisify( cb => server._close( cb ));
  server._listen = server.listen;
  server.listen = promisify(( port, cb ) => server._listen( port, cb ));


  await server.listen( port );

  return server;
};

const createBrowser = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto( path );

  return [ browser, page ];
};


// Label test suite in output
// test( '-------------------------------', async t => {
//   t.comment( 'Running *Tab* test suite.' );
//   t.comment( '-------------------------------' );
//   t.end();
// });


test( 'POST respond with text/plain', async t => {
  const match = 'test';
  const method = 'POST';

  const server = await createServer(( req, res ) => {
    t.same( req.method, method, `Method is ${method}` );

    res.setHeader( 'Content-Type', 'text/plain' );
    res.end( match );
  }, t );

  const [ browser, page ] = await createBrowser();

  const result = await page.evaluate( url => {
    return window.fetcher.send( url ).catch( e => e );
  }, url );

  t.same( result.data, match, `response match «${match}»` );

  await browser.close();
  await server.close();

  t.end();
});

test( 'POST respond with application/json', async t => {
  const match = { test: 'test' };
  const method = 'POST';

  const server = await createServer(( req, res ) => {
    t.same( req.method, method, `Method is ${method}` );

    res.setHeader( 'Content-Type', 'application/json' );
    res.end( JSON.stringify( match ));
  }, t );

  const [ browser, page ] = await createBrowser();

  const result = await page.evaluate( url => {
    return window.fetcher.send( url ).catch( e => e );
  }, url );

  t.same( JSON.stringify( result.data ), JSON.stringify( match ), `response match «${JSON.stringify( match )}»` );

  await browser.close();
  await server.close();

  t.end();
});

test( 'POST receives a JSON', async t => {
  const match = { test: 'test' };
  const contentType = 'application/json';
  const method = 'POST';

  const server = await createServer(( req, res ) => {
    t.same( req.method, method, `Method is ${method}` );
    t.same( req.headers[ 'content-type' ].split( ';' )[ 0 ], contentType, `Content-Type header is «${contentType}»` );

    let body = [];

    req.on( 'data', ( chunk ) => {
      body.push( chunk );
    }).on( 'end', () => {
      body = Buffer.concat( body ).toString();
      t.same( body, JSON.stringify( match ), `Recieved data is «${JSON.stringify( match )}»` );
    });

    res.end( 'ok' );
  }, t );

  const [ browser, page ] = await createBrowser();

  await page.evaluate(( url, match ) => {
    return window.fetcher.send( url, {
      data: match
    }).catch( e => e );
  }, url, match );

  // t.same( result.data, match, `response match «${match}»` );
  await browser.close();
  await server.close();

  t.end();
});

test( 'POST receives a FormData', async t => {
  const match = 'ok';
  const contentType = 'multipart/form-data';
  const method = 'POST';

  const server = await createServer(( req, res ) => {
    t.same( req.method, method, `Method is ${method}` );
    t.same( req.headers[ 'content-type' ].split( ';' )[ 0 ], contentType, `Content-Type header is «${contentType}»` );

    const busboy = new Busboy({ headers: req.headers });

    let fieldIndex = 0;

    // busboy.on( 'file', ( fieldname, file, filename, encoding, mimetype ) => {
    //   console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);

    //   file.on( 'data', data => {
    //     console.log('File [' + fieldname + '] got ' + data.length + ' bytes');
    //   });

    //   file.on( 'end', () => {
    //     console.log('File [' + fieldname + '] Finished');
    //   });
    // });

    busboy.on( 'field', ( fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype ) => {
      fieldIndex++;
      t.same( fieldname, `test${fieldIndex}`, `fieldname ${fieldIndex} has the right name (test${fieldIndex})` );
      t.same( val, 'test', `fieldname ${fieldIndex} has the right value (test)` );
    });

    busboy.on( 'finish', () => {
      res.setHeader( 'Content-Type', 'text/plain' );
      res.end( match );
    });

    req.pipe( busboy );
  }, t );

  const [ browser, page ] = await createBrowser();

  const result = await page.evaluate( url => {
    const data = new FormData();

    data.append( 'test1', 'test' );
    data.append( 'test2', 'test' );

    return window.fetcher.send( url, {
      data
    }).catch( e => e );
  }, url );

  t.same( result.data, match, `response match «${match}»` );

  await browser.close();
  await server.close();

  t.end();
});

test( 'POST receives a Blob', async t => {
  const match = 'ok';
  const contentType = 'text/plain';
  const method = 'POST';

  const server = await createServer(( req, res ) => {
    t.same( req.method, method, `Method is ${method}` );
    t.same( req.headers[ 'content-type' ].indexOf( contentType ), 0, `Content-Type header is «${contentType}»` );

    let body = [];

    req.on( 'data', ( chunk ) => {
      body.push( chunk );
    }).on( 'end', () => {
      body = Buffer.concat( body ).toString();
      // console.log( body );
      t.same( body, match, `Recieved data is «${match}»` );
    });

    res.setHeader( 'Content-Type', 'text/plain' );
    res.end( match );
  }, t );

  const [ browser, page ] = await createBrowser();

  const result = await page.evaluate(( url, match, contentType ) => {
    const data = new Blob([ match ], { type: contentType });

    return window.fetcher.send( url, {
      data
    }).catch( e => e );
  }, url, match, contentType );

  t.same( result.data, match, `response match «${match}»` );

  await browser.close();
  await server.close();

  t.end();
});

test( 'GET respond with text/plain', async t => {
  const match = 'test';
  const method = 'GET';

  const server = await createServer(( req, res ) => {
    t.same( req.method, method, `Method is ${method}` );

    res.setHeader( 'Content-Type', 'text/plain' );
    res.end( match );
  }, t );

  const [ browser, page ] = await createBrowser();

  const result = await page.evaluate( url => {
    return window.fetcher.get( url ).catch( e => e );
  }, url );

  t.same( result.data, match, `response match «${match}»` );

  await browser.close();
  await server.close();

  t.end();
});

test( 'GET respond with application/json', async t => {
  const match = { test: 'test' };
  const method = 'GET';

  const server = await createServer(( req, res ) => {
    t.same( req.method, method, `Method is ${method}` );

    res.setHeader( 'Content-Type', 'application/json' );
    res.end( JSON.stringify( match ));
  }, t );

  const [ browser, page ] = await createBrowser();

  const result = await page.evaluate( url => {
    return window.fetcher.get( url ).catch( e => e );
  }, url );

  t.same( JSON.stringify( result.data ), JSON.stringify( match ), `response match «${JSON.stringify( match )}»` );

  await browser.close();
  await server.close();

  t.end();
});

test( 'PUT respond with text/plain', async t => {
  const match = 'test';
  const method = 'PUT';

  const server = await createServer(( req, res ) => {
    t.same( req.method, method, `Method is ${method}` );

    res.setHeader( 'Content-Type', 'text/plain' );
    res.end( match );
  }, t );

  const [ browser, page ] = await createBrowser();

  const result = await page.evaluate( url => {
    return window.fetcher.send( url, {
      method: 'put'
    }).catch( e => e );
  }, url );

  t.same( result.data, match, `response match «${match}»` );

  await browser.close();
  await server.close();

  t.end();
});

test( 'Send method doesn\'t rewrite the user defined "Content-Type" header', async t => {
  const match = 'test';
  const contentType = 'text/svg';

  const server = await createServer(( req, res ) => {
    t.same( req.headers[ 'content-type' ].split( ';' )[ 0 ], contentType, `Content-Type header is «${contentType}»` );

    res.setHeader( 'Content-Type', 'text/plain' );
    res.end( match );
  }, t );

  const [ browser, page ] = await createBrowser();

  const result = await page.evaluate(( url, contentType ) => {
    return window.fetcher.send( url, {
      headers: {
        'content-type': contentType
      }
    }).catch( e => e );
  }, url, contentType );

  t.same( result.data, match, `response match «${match}»` );

  await browser.close();
  await server.close();

  t.end();
});

test( 'Send method doesn\'t rewrite the user defined "Content-Type" header when sending data', async t => {
  const match = { test: 'test' };
  const contentType = 'text/svg';

  const server = await createServer(( req, res ) => {
    t.same( req.headers[ 'content-type' ].split( ';' )[ 0 ], contentType, `Content-Type header is «${contentType}»` );

    let body = [];

    req.on( 'data', ( chunk ) => {
      body.push( chunk );
    }).on( 'end', () => {
      body = Buffer.concat( body ).toString();
      t.same( body, JSON.stringify( match ), `Recieved data is «${JSON.stringify( match )}»` );
    });

    res.setHeader( 'Content-Type', 'application/json' );
    res.end( JSON.stringify( match ));
  }, t );

  const [ browser, page ] = await createBrowser();

  const result = await page.evaluate(( url, contentType, data ) => {
    return window.fetcher.send( url, {
      headers: {
        'content-type': contentType
      },
      data
    }).catch( e => e );
  }, url, contentType, match );

  t.same( result.data, match, `response match «${match}»` );

  await browser.close();
  await server.close();

  t.end();
});

test( 'Send method allow passing user defined headers', async t => {
  const match = 'test';
  const contentType = 'text/svg';
  const headers = {
    'Accept': contentType,
    'X-test': 'true'
  };

  const server = await createServer(( req, res ) => {
    Object.entries( headers ).forEach(([ header, value ]) => {
      t.same( req.headers[ header.toLowerCase() ], value, `User defined header «${header} is «${value}»` );
    });

    res.setHeader( 'Content-Type', 'text/plain' );
    res.end( match );
  }, t );

  const [ browser, page ] = await createBrowser();

  const result = await page.evaluate(( url, headers ) => {
    return window.fetcher.send( url, {
      headers
    }).catch( e => e );
  }, url, headers );

  t.same( result.data, match, `response match «${match}»` );

  await browser.close();
  await server.close();

  t.end();
});

test( 'Get method doesn\'t rewrite the user defined "Content-Type" header', async t => {
  const match = 'test';
  const contentType = 'text/svg';

  const server = await createServer(( req, res ) => {
    t.same( req.headers[ 'content-type' ].split( ';' )[ 0 ], contentType, `Content-Type header is «${contentType}»` );

    res.setHeader( 'Content-Type', 'text/plain' );
    res.end( match );
  }, t );

  const [ browser, page ] = await createBrowser();

  const result = await page.evaluate(( url, contentType ) => {
    return window.fetcher.get( url, {
      headers: {
        'content-type': contentType
      }
    }).catch( e => e );
  }, url, contentType );

  t.same( result.data, match, `response match «${match}»` );

  await browser.close();
  await server.close();

  t.end();
});


test( 'Get method allow passing user defined headers', async t => {
  const match = 'test';
  const contentType = 'text/svg';
  const headers = {
    'Accept': contentType,
    'X-test': 'true'
  };

  const server = await createServer(( req, res ) => {
    Object.entries( headers ).forEach(([ header, value ]) => {
      t.same( req.headers[ header.toLowerCase() ], value, `User defined header «${header} is «${value}»` );
    });

    res.setHeader( 'Content-Type', 'text/plain' );
    res.end( match );
  }, t );

  const [ browser, page ] = await createBrowser();

  const result = await page.evaluate(( url, headers ) => {
    return window.fetcher.get( url, {
      headers
    }).catch( e => e );
  }, url, headers );

  t.same( result.data, match, `response match «${match}»` );

  await browser.close();
  await server.close();

  t.end();
});
