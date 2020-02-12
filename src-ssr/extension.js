/*
 * This file runs in a Node context (it's NOT transpiled by Babel), so use only
 * the ES6 features that are supported by your Node version. https://node.green/
 *
 * WARNING!
 * If you import anything from node_modules, then make sure that the package is specified
 * in package.json > dependencies and NOT in devDependencies
 *
 * Note: This file is used for both PRODUCTION & DEVELOPMENT.
 * Note: Changes to this file (but not any file it imports!) are picked up by the
 * development server, but such updates are costly since the dev-server needs a reboot.
 */

module.exports.extendApp = function ({ app, ssr }) {
  /*
     Extend the parts of the express app that you
     want to use with development server too.

     Example: app.use(), app.get() etc
  */

  // CAS Authentication (https://www.npmjs.com/package/cas-authentication).
  const
    path = require('path'),
    session = require('express-session'),
    CasAuth = require('cas-authentication'),
    sessionSecret = process.env.SESSION_SECRET || 'parastratiosphecomyiastratiosphecomyioides',
    duration = 24 * 60 * 60 * 7 * 1000;
  // Set up an Express session, which is required for CASAuthentication.
  app.use( session({
      cookieName        : 'session',
      secret            : sessionSecret,
      resave            : false,
      saveUninitialized : true,
      duration          : duration,
      activeDuration    : duration
  }));

  // Create a new instance of CasAuth.
  // const cas = new CasAuth({
  //   cas_url: 'https://secure.its.yale.edu/cas',
  //   service_url: 'http://localhost:8080/',
  //   version: '1.0'
  // });

  const cas = new CASAuth({
    cas_url: casUrl || 'https://secure.its.yale.edu/cas',
    service_url: '',
    cas_version: '1.0'
  });

  // Help make running on Heroku easier for students. Let's automatically
  // change the `service_url` on the first request.
  let serviceURLchecked = false;
  cas.checkServiceURL = (req, res, next) => {
    if (serviceURLchecked === false) {
      const protocol = req.secure ? 'https' : 'http'
      cas.service_url = `${protocol}://${req.headers.host}`;
      serviceURLchecked = true;
    }
    next();
  }

  // This route will de-authenticate the client with the Express server and then
  // redirect the client to the CAS logout page.
  app.get('/logout', cas.logout);
  // Small middleware that sets the CAS auth service_url on first request.
  app.use(auth.checkServiceURL);
  // Unauthenticated users should get redirected to CAS login before any route.
  app.use(cas.bounce);

};
