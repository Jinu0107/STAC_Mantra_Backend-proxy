const express = require('express');
const nugu = require('../nugu');
const router = express.Router();

router.post('/nugu/StartMeditationAction', nugu);
router.post('/nugu/RecordMeditationAction', nugu);
router.post('/nugu/StartWhitenoiseAction', nugu);
router.post('/nugu/StartSleepAction', nugu);
router.post('/nugu/StopMeditationAction', nugu);
router.post('/nugu/UserIdxAction', nugu);
router.post('/nugu/FinishMeditationAction', nugu);

router.get('/abc', (req, res) => {
	res.send('<h1>Hello World</h1>');

});

module.exports = router;
