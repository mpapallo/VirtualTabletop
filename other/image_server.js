// Adapted from Rafał Pocztarski
// https://github.com/rsp/node-static-http-servers

const info = 'node-static-http-servers by Rafał Pocztarski\n'
         + 'Examples of HTTP static file serving in Node.js\n'
         + 'See: https://github.com/rsp/node-static-http-servers\n'
         + 'Example using: express.static';

const path = require('path'),
	express = require('express'),
	fs = require('fs'),
	parser = require('xml2json'),
	app = express();

// CORS middleware
const allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Access-Control-Allow-Headers', '*');
    next();
};
app.use(allowCrossDomain);

const dir = path.join(__dirname, 'public');

// Serve static files from db (mostly fragment images)
app.use(express.static(dir));

// /get-workspaces endpoint
// Sends list of .xml files in specified folder (crates/ or matches/)
app.get('/get-workspaces', async (req, res) => {
	const folder = req.query.folder || 'crates';
	const fullpath = './public/tongeren_vrijthof_db/workspace/' + folder;
	const workspaces = [];
	fs.readdir(fullpath, (err, files) => {
		if (err) {
			console.error(err);
			return;
		}
		for (const file of files) {
			if (file.endsWith('.xml')) {
				workspaces.push(file);
			}
		}
		res.send( { workspaces: workspaces } );
	});
});

// /get-xml endpoint
// Serves xml info for specified workspace as JSON
app.get('/get-xml', (req, res) => {
	const id = req.query.id
	const fullpath = './public/tongeren_vrijthof_db/workspace/' + id + '.xml';
	fs.readFile(fullpath, (err, data) => {
		if (err) {
			console.error(err)
			return;
		}
		const json = JSON.parse(parser.toJson(data, {reversible: true}));
		res.send(json);
	})
});

app.listen(3000, function () {
    console.log('Listening on http://localhost:3000/');
});

console.log(info);
