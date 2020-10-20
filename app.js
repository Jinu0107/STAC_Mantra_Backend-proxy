const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const fs = require('fs');
const { SERVER_PORT } = require('./config.js');
const routes = require('./routes');
const audioconcat = require('audioconcat');

const { saveAudio, repeatAudioAndGetPath, vacateMusic, getSleep, getMedidation } = require('./ffmpeg');

const app = express();

app.use(bodyParser.json());
app.use(morgan('common'));
app.use((err, req, res, next) => next());

app.get('/music/:end/:type/:file', async (req, res) => {
	const { end, type, file } = req.params;
	let filename;
	if 		(type === "meditation") filename = await getMedidation(end);
	else if (type === "white_noise") filename = await repeatAudioAndGetPath({ file: `music/${type}/${file}.mp3`, cnt: end });
	else if (type === "sleep") filename = await getSleep(end);
	else if (type === "stop") filename = await repeatAudioAndGetPath({ file: `music/${type}/${file}.mp3`, cnt: end });
	try {
		console.log(filename);
		res.sendFile(path.join(__dirname, `${filename}`));
	} catch (err) {
		console.log(err);
	}

});

app.use('/', routes);

app.get('/health', (req, res) => {
	res.status(200).send('OK');
});

// setInterval 돌려서 *.mp3 다 조지기
vacateMusic();

app.listen(SERVER_PORT, () => {
	console.log(`Server is running on ${SERVER_PORT} port`);
});