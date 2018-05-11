/* eslint-env node */
const test = require( 'tape' );
const puppeteer = require( 'puppeteer' );
const path = `file://${__dirname}/index.html`;

const createBrowser = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.evaluateOnNewDocument( mockFetch );
  await page.goto( path );

  return [ browser, page ];
};

const mockFetch = () => {

  window.fetch = async ( url, params ) => {
    if( window.tape ){
      await window.tape( url, params, window.fetcher.config );
    }

    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve( 'ok' ),
      text: () => Promise.resolve( 'ok' ),
      blob: () => Promise.resolve( 'ok' ),
      formData: () => Promise.resolve( 'ok' ),
      headers: {
        get: () => 'application/json',
        entries: () => {
          const items = [
            [ 'content-type', 'application/json' ]
          ];

          const iterator = {
            next: function() {
              const value = items.shift();

              return { done: value === undefined, value: value };
            }
          };

          iterator[ Symbol.iterator ] = function() {
            return iterator;
          };

          return iterator;
        }
      }
    });
  };
};

test( 'User defined options can be passed', async t => {
  const match = {
    credentials: 'include',
    cache: 'no-cache'
  };

  const [ browser, page ] = await createBrowser();

  await page.exposeFunction( 'tape', ( url, params ) => {
    Object.entries( match ).forEach(([ option, value ]) => {
      t.same( params[ option ], match[ option ], `Fetch option «${option}» matches «${value}»` );
    });
  });

  await page.evaluate( match => {
    return window.fetcher.get( 'url', match ).catch( e => e );
  }, match );

  await browser.close();

  t.end();
});

test( 'User defined headers are merged with the defaults', async t => {
  const match = {
    'Content-Type': 'application/json',
    'Accept': 'text/plain'
  };

  const [ browser, page ] = await createBrowser();

  await page.exposeFunction( 'tape', ( url, params, config ) => {
    // test default headers
    Object.entries( config.headers ).forEach(([ option, value ]) => {
      t.same( params.headers[ option ], config.headers[ option ], `Fetch header «${option}» matches «${value}»` );
    });

    // test user's headers
    Object.entries( match ).forEach(([ option, value ]) => {
      t.same( params.headers[ option ], match[ option ], `Fetch header «${option}» matches «${value}»` );
    });
  });

  await page.evaluate( match => {
    return window.fetcher.get( 'url', {
      headers: match
    }).catch( e => e );
  }, match );

  await browser.close();

  t.end();
});

test( 'Response is well formated', async t => {
  const match = 'ok';

  const [ browser, page ] = await createBrowser();

  const result = await page.evaluate(() => {
    return window.fetcher.get( 'url' ).catch( e => e );
  }, match );

  t.same( typeof result, 'object', 'Response is an object' );
  t.same( result.data, match, `Response has a data entry with a value of «${result.data}»` );
  t.same( 'json' in result, false, 'Response is parsed' );

  await browser.close();

  t.end();
});

test( 'Response is well formated when not parsed', async t => {
  const match = 'ok';

  const [ browser, page ] = await createBrowser();

  const result = await page.evaluate(() => {
    return window.fetcher.get( 'url', {}, false ).catch( e => e );
  }, match );

  t.same( typeof result, 'object', 'Response is an object' );
  t.same( 'data' in result, false, 'Response has no data entry' );
  t.same( 'json' in result, true, 'Response is not parsed' );

  await browser.close();

  t.end();
});
