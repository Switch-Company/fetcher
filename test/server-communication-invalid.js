/* eslint-env node */
'use strict';
// require('leaked-handles');

const test = require( 'tape' );
const puppeteer = require( 'puppeteer' );
const http = require( 'http' );
const promisify = require( 'util' ).promisify;

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

    t.same( req.url, '/test', 'Requested url is valid' );
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

test( 'Request fails to fetch', async t => {
  const match = 0;
  const entries = [ 'status', 'statusText', 'url' ];

  const [ browser, page ] = await createBrowser();

  const result = await page.evaluate( url => {
    return window.fetcher.send( url ).catch( e => e );
  }, url );

  entries.forEach( entry => {
    t.ok( entry in result, `Response has a «${entry}» entry` );
  });

  t.same( Object.keys( result ).length, entries.length, `Response has only ${entries.length} entries` );
  t.same( result.status, match, `Response status matches «${match}»` );
  t.same( result.url, url, `Response url matches «${url}»` );

  await browser.close();

  t.end();
});

test( 'Request times out', async t => {
  const match = 599;
  const method = 'GET';
  const entries = [ 'status', 'statusText', 'url' ];

  const server = await createServer(( req, res ) => {
    t.same( req.method, method, `Method is ${method}` );
    global.setTimeout(() => {
      res.setHeader( 'Content-Type', 'text/plain' );
      res.end( '' );
    }, 10 );
  }, t );

  const [ browser, page ] = await createBrowser();

  const result = await page.evaluate( url => {
    window.fetcher.config.timeout = 9;

    return window.fetcher.get( url ).catch( e => e );
  }, url );

  entries.forEach( entry => {
    t.same( entry in result, true, `Response has a «${entry}» entry` );
  });

  t.same( Object.keys( result ).length, entries.length, `Response has only ${entries.length} entries` );
  t.same( result.status, match, `Response status matches «${match}»` );
  t.same( result.url, url, `Response url matches «${url}»` );

  await browser.close();
  await server.close();

  t.end();
});

test( 'Response parsing fails', async t => {
  const method = 'GET';

  const server = await createServer(( req, res ) => {
    t.same( req.method, method, `Method is ${method}` );

    res.setHeader( 'Content-Type', 'application/json' );
    res.end( '{test:test}' );
  }, t );

  const [ browser, page ] = await createBrowser();

  page.evaluate( url => {
    return window.fetcher.get( url );
  }, url )
    .then(() => {
      t.fail( 'JSON parsing is not rejected' );
    })
    .catch(() => {
      t.pass( 'JSON parsing is rejected' );
    })
    .then( async () => {
      await browser.close();
      await server.close();

      t.end();
    });
});

test( 'Response is not «ok»', async t => {
  const method = 'GET';
  const statusCode = 403;
  const match = { test: 'test' };
  const entries = [ 'headers', 'data', 'ok', 'redirected', 'status', 'statusText', 'type', 'url' ];

  const server = await createServer(( req, res ) => {
    t.same( req.method, method, `Method is ${method}` );

    res.setHeader( 'Content-Type', 'application/json' );
    res.statusCode = statusCode;
    res.end( JSON.stringify( match ));
  }, t );

  const [ browser, page ] = await createBrowser();

  const [ result, rejected ] = await page.evaluate( url => {
    return window.fetcher.get( url ).catch( e => [ e, true ]);
  }, url );

  t.ok( rejected, 'Response is rejected' );

  entries.forEach( entry => {
    t.ok( entry in result, `Response has a «${entry}» entry` );
  });

  t.same( Object.keys( result ).length, entries.length, `Response has only ${entries.length} entries` );

  t.notOk( result.ok, 'Response is not «ok»' );
  t.same( result.status, statusCode, `Response status code match «${statusCode}»` );
  t.same( JSON.stringify( result.data ), JSON.stringify( match ), `Recieved data is «${JSON.stringify( match )}»` );

  await browser.close();
  await server.close();

  t.end();
});
