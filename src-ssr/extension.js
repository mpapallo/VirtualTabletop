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

  // // CORS middleware
  // const allowCrossDomain = function(req, res, next) {
  //     res.header('Access-Control-Allow-Origin', '*');
  //     res.header('Access-Control-Allow-Methods', '*');
  //     res.header('Access-Control-Allow-Headers', '*');
  //     next();
  // }
  // app.use(allowCrossDomain)

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
    xml2js = require('xml2js'),
    probe = require('probe-image-size');
  const { matrix } = require('mathjs')

  // Workspace endpoint, query must contain id of workspace.
  app.get('/workspace', async (req, res) => {
    const workspace_id = req.query.id;
    if (!workspace_id) { return }
    // fetch workspace xml file served as JSON
    const url = new URL('http://localhost:3000/get-xml/');
    url.searchParams.append('id', workspace_id);
    let response = await fetch(url);
    let data = await response.json();

    // parse info for pair annotations
    const matches = [];
    if (data.XML.PairAnnotation) {
      let match_num = 0;
      data.XML.PairAnnotation.forEach(match => {
        const m = match // { status, tgt, comment, src }
        m.num = match_num
        match_num += 1
        matches.push(m)
      })
    }

    // parse info for each group of fragments
    const groups = [];
    let group_num = 0;
    for (let g_index = 0; g_index < data.XML.group.length; g_index ++) {
      const g = data.XML.group[g_index];
      let group_obj = {};
      group_obj.num = group_num;
      group_num += 1;

      // parse group transform matrix as array of vals
      const group_transform = g.XF['$t'].split(/\s/);
      let group_xf = [];
      group_transform.forEach(num => {
        group_xf.push(Number(parseFloat(num)));
      })
      group_xf[3] *= 5;
      group_xf[7] *= 5;
      group_obj.xf = group_xf;

      // parse each fragment info within group
      group_obj.fragments = [];
      let frag_num = 0;
      for (let f_index = 0; f_index < g.fragment.length; f_index ++) {
        // extract fragment info from XML
        const f = g.fragment[f_index];
        const frag_obj = extractFragInfo(f, frag_num);
        frag_num += 1;
        // get dimension info
        try {
          const result = await probe(frag_obj.url);
          frag_obj.w = result.width;
          frag_obj.h = result.height;
        } catch (e) {
          frag_obj.w = 0;
          frag_obj.h = 0;
        }
        // push fragment to group
        group_obj.fragments.push(frag_obj);
      }

      // push group to groups list
      groups.push(group_obj);
    }

    // parse info for each ungrouped fragment
    let fragments = [];
    for (let f_index = 0; f_index < data.XML.fragment.length; f_index ++) {
      const f = data.XML.fragment[f_index]
      // extract fragment info from XML
      const frag_obj = extractFragInfo(f, f_index);
      // get dimension info
      try {
        const result = await probe(frag_obj.url);
        frag_obj.w = result.width;
        frag_obj.h = result.height;
      } catch (e) {
        frag_obj.w = 0;
        frag_obj.h = 0;
      }
      // push to fragment list
      fragments.push(frag_obj);
    }

    // send extracted info
    res.send( { groups: groups, fragments: fragments, matches: matches } );
  });

  const extractFragInfo = function (f, num) {
    let frag_obj = {};
    frag_obj.num = num;

    // parse id for url
    frag_obj.id = f.ID;
    frag_obj.url = 'http://localhost:3000/tongeren_vrijthof_db/fragments/' + frag_obj.id + '/front-2d/color-masked.png';

    // parse fragment transform matrix as array of vals
    let frag_xf = [];
    const transform = f.XF['$t'].split(/\s/);
    transform.forEach(num => {
      frag_xf.push(Number(parseFloat(num)));
    })
    frag_xf[3] *= 5;
    frag_xf[7] *= 5;
    frag_obj.xf = frag_xf;

    return frag_obj;
  };

};
