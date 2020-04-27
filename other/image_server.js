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

app.use(express.static(dir));

app.get('/get-crates', async (req, res) => {
	const crates = [];
	fs.readdir('./public/tongeren_vrijthof_db/workspace/crates/', (err, files) => {
		if (err) {
			console.error(err);
			return;
		}
		for (const file of files) {
			if (file.endsWith('.xml')) {
				crates.push(file);
			}
		}
		res.send( { crates: crates } );
	});
});

app.get('/get-xml', (req, res) => {
	const id = req.query.id
	fs.readFile('./public/tongeren_vrijthof_db/workspace/crates/' + id + '.xml', (err, data) => {
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
