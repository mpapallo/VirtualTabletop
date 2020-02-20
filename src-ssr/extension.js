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

  //********************//
  // CAS Authentication (https://www.npmjs.com/package/cas-authentication)
  //********************//
  const
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
  // Authentication code adapted from https://github.com/sketsdever/deadpeople (former group project of mine).
  const cas = new CasAuth({
    cas_url: 'https://secure.its.yale.edu/cas',
    service_url: '',
    cas_version: '1.0'
  });
  // Automatically change the `service_url` on the first request.
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
  // app.get('/logout', cas.logout);
  // // Small middleware that sets the CAS auth service_url on first request.
  // app.use(cas.checkServiceURL);
  // // Unauthenticated users should get redirected to CAS login before any route.
  // app.use(cas.bounce);

  //********************//
  // Workspaces
  //********************//
  const
    util = require('util'),
    fetch = require('node-fetch'),
    fs = require('fs'),
    xml2js = require('xml2js');
  // Workspace endpoint, query must contain id of workspace.
  app.get('/workspace', async (req, res) => {
    console.log(req.url);
    const workspace_id = req.query.id;
    // let url = 'http://localhost:3000/tongeren_vrijthof_db/workspace/' + workspace_id + '.png';
    // console.log(url);
    // res.send( { image_url: url } );
    const parser = new xml2js.Parser();
    fs.readFile(__dirname + '/../src/assets/xml/' + workspace_id + '.xml', (err, data) => {
      parser.parseString(data, (err, result) => {
        // console.log(util.inspect(result.XML, false, null));
        let groups = [];
        let group_num = 0;
        result.XML.group.forEach(g => {
          let group_obj = {};
          group_obj.num = group_num;
          group_num += 1;
          group_obj.xf = g.XF[0];
          group_obj.fragments = [];
          let frag_num = 0;
          g.fragment.forEach(f => {
            let frag_obj = {};
            frag_obj.num = frag_num;
            frag_num += 1;
            frag_obj.id = f['$'].ID;
            // add URLS for images (front-2d, mask, etc.)
            frag_obj.url = 'http://localhost:3000/tongeren_vrijthof_db/fragments/' + frag_obj.id + '/front-2d/color.png';
            frag_obj.xf = f.XF[0];
            group_obj.fragments.push(frag_obj);
          });
          groups.push(group_obj);
        });
        // console.log(util.inspect(groups, false, null));
        res.send( { groups: groups } );
      });
    });
  })


};
