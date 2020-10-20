const uuid = require('uuid').v4;
const _ = require('lodash');
const { DOMAIN } = require('../config');
const mysql = require("mysql");
const db = mysql.createConnection({
	host: '????',
	user: '????',
	password: '????',
	database: '????'

});



const log = console.log;
const dir = console.dir;

db.connect();

class Directive {
	constructor({ type, audioItem }) {
		this.type = type;
		this.audioItem = audioItem;
	}
}

function audioPlayerDirective(audioPlayTime, soundFileName) {
	log(`${DOMAIN}/${audioPlayTime}/${soundFileName}`);
	return new Directive({
		type: 'AudioPlayer.Play',
		audioItem: {
			stream: {
				url: `${DOMAIN}/${audioPlayTime}/${soundFileName}`,
				offsetInMilliseconds: 0,
				progressReport: {
					progressReportDelayInMilliseconds: 5000
				},

				token: uuid(),
				expectedPreviousToken: 'expectedPreviousToken',
			}
		}
	});
}


function setAudioPlayTime(hour, minute) {
	const result = {};
	result.hour = hour;
	result.minute = minute;
	//사용자가 시간설정을 하지 않을 경우에는v  기본값인 30분으로 시간을 설정.
	if (hour == 0 && minute == 0) result.minute = 30;

	//사용자가 5시간 이상 시간설정을 할 경우 시간을 5시간으로 고정.
	if (hour > 5 || (hour == 5 && minute > 0)) {
		result.minute = 0;
		result.hour = 5;
	}
	return result;
}

function getAudioPlayTime(hour, minute) {
	let time = "";
	if (hour > 0) time = `${hour}시간`;
	if (minute > 0) time += ` ${minute}분`;
	return time;
}

function getScoreOutput(yesterday_score, now_score) {
	let msg = '오늘 명상 점수는';

	if (now_score > yesterday_score) {
		msg += `${now_score}으로 가장 최근의 명상점수인 ${yesterday_score}보다 좋아졌네요.`;
	} else {
		msg += `${now_score}으로 가장 최근의 명상점수인 ${yesterday_score}보다 낮아졌네요.`;
	}

	return msg;
}


Date.prototype.toDBString = function () {
	return `${this.getFullYear()}-${this.getMonth() + 1}-${this.getDate()}`;
}

class NPKRequest {
	constructor(httpReq) {
		dir("이건 이벤트 입니다. " + httpReq.body.event);
		this.context = httpReq.body.context;
		this.action = httpReq.body.action;
		this.actionName = "";
		this.parameters = "";
		// console.log(`NPKRequest: ${JSON.stringify(this.context)}, ${JSON.stringify(this.action)}`);
	}

	do(npkResponse) {
		this.actionRequest(npkResponse);
	}

	actionRequest(npkResponse) {
		log("======================== action  ========================================");
		console.dir(this.action);
		log("=========================================================================");

		const actionName = this.action.actionName;
		const parameters = this.action.parameters;
		log(actionName);

		switch (actionName) {
			case 'StartMeditationAction':
				this.StartMeditationAction(parameters);
				break;
			case 'RecordMeditationAction':
				this.RecordMeditationAction(parameters);
				break;
			case 'StartWhitenoiseAction':
				this.StartWhitenoiseAction(parameters);
				break;
			case 'StartSleepAction':
				this.StartSleepAction(parameters);
				break;
			case 'StopMeditationAction':
				this.StopMeditationAction(parameters);
				break;
			case 'FinishMeditationAction':
				this.FinishMeditationAction(parameters);
				break;
		}
	}

	StopMeditationAction(params) {
		const SOUND_FILE_NAME = "stop/music_stop";
		const AUDIO_PLAY_TIME = 1;
		npkResponse.addDirective(audioPlayerDirective(AUDIO_PLAY_TIME, SOUND_FILE_NAME));
	}


	// 명상 지도 서비스
	StartMeditationAction(params) {
		const result = {};
		let soundFileName = "meditation/start";
		// input 파라미터
		let { hour, minute } = setAudioPlayTime(params.meditation_playing_hour.value, params.meditation_playing_minute.value);
		// output 파라미터
		let audioPlayTime = minute * 1;
		audioPlayTime += hour * 60;

		result.meditation_playing_time = getAudioPlayTime(hour, minute);
		npkResponse.setActionOutput(result);
		npkResponse.addDirective(audioPlayerDirective(audioPlayTime, soundFileName));
	}

	// 명상중 중간에 멈췄을때 재생하는 부분
	async RecordMeditationAction(params) {
		const SCORE = params.score.value;
		const UNIQUE_ID = params.unique_id.value;
		const RESULT = {};
		RESULT.meditation_score_message = await this.ScoreRecord(SCORE, UNIQUE_ID);
		npkResponse.setActionOutput(RESULT);
	}
	// 명상이 모두 끝난 후 점수 입력하는 부분
	async FinishMeditationAction(params) {
		const SCORE = params.finish_score.value;
		const UNIQUE_ID = params.finish_unique_id.value;
		const RESULT = {};
		RESULT.finish_meditation_score_message = await this.ScoreRecord(SCORE, UNIQUE_ID);
		npkResponse.setActionOutput(RESULT);
	}


	//DB에 들어가는 부분
	ScoreRecord(SCORE, UNIQUE_ID) {
		return new Promise((res, rej) => {
			if (SCORE > 100) {
				res("점수는 1점이상 100점 이하로만 말씀해주세요.");
			}
			const ID_FIRST_LETTER = String.fromCharCode(UNIQUE_ID.substr(0, 2));
			const ID_SECOND_LETTER = String.fromCharCode(UNIQUE_ID.substr(2, 2));
			const USER_IDX = UNIQUE_ID.substr(4);

			let sql = "SELECT * FROM mantra_users WHERE substr(user_id,1,2) = concat(?,?) AND user_idx = ?";
			//사용자가 발화한 unique_id 가 실제로 존재하는 유저인지 아닌지
			db.query(sql, [ID_FIRST_LETTER, ID_SECOND_LETTER, USER_IDX], function (err, r) {
				if (r.length == 0) {
					//해당 유저가 존재하지 않을 때
					res("해당 유저는 존재하지 않습니다. 만트라 앱 내에서 기록을 해주시길 바랍니다.");
				} else {
					//유저가 존재할때
					const DATE = new Date().toDBString();

					sql = "SELECT * FROM mantra_record WHERE date = ? AND user_idx = ?";
					db.query(sql, [DATE, USER_IDX], function (err, r) {
						if (r.length != 0) {
							//오늘 이미 기록을 했다면
							res("오늘은 이미 작성을 마쳤습니다! 작성한 기록은 '만트라' 어플 내 기록 탭에서 확인할 수 있습니다.");
						} else {
							//오늘 기록이 처음 이라면

							//실제로 입력하는 부분
							sql = "INSERT INTO mantra_record (record_idx, user_idx, date , score , comment) VALUES ( ?, ?, ?, ?, ?)";

							db.query(sql, [null, USER_IDX, DATE, SCORE, "NUGU를 통한 입력은 한줄평이 불가능 합니다."], function (err, r) {
								res("성공적으로 입력되었습니다.");
							});
						}
					});
				}
			});

		});



	}


	// 공부 도움 서비스
	StartWhitenoiseAction(params) {
		const result = {};
		let { hour, minute } = setAudioPlayTime(params.whitenoise_playing_hour.value, params.whitenoise_playing_minute.value);
		let soundFileName = "";

		switch (params.whitenoise_type.value) {
			case '카페소리':
				soundFileName = "white_noise/rain";
				break;
			case '파도소리':
				soundFileName = "white_noise/wave";
				break;
			case '빗소리':
				soundFileName = "white_noise/rain";
				break;
		}

		let audioPlayTime = minute * 1;
		audioPlayTime += hour * 60;

		result.whitenoise_playing_time = getAudioPlayTime(hour, minute);
		result.whitenoise_type = params.whitenoise_type.value;
		npkResponse.setActionOutput(result);
		npkResponse.addDirective(audioPlayerDirective(audioPlayTime, soundFileName));
	}

	// 수면 유도 서비스
	StartSleepAction(params) {
		let soundFileName = "sleep/start";
		let audioPlayTime = 30;
		npkResponse.addDirective(audioPlayerDirective(audioPlayTime, soundFileName));
	}
}

class NPKResponse {
	constructor() {
		this.version = '2.0';
		this.resultCode = 'OK';
		this.output = {};
		this.directives = [];

		console.log('NPKResponse constructor');
	}

	setActionOutput(result) {
		console.log("*** set output parameters");
		this.output = result;
	}

	addDirective(directive) {
		this.directives.push(directive);
	}
}

const nuguReq = function (httpReq, httpRes, next) {

	npkResponse = new NPKResponse();
	npkRequest = new NPKRequest(httpReq);
	npkRequest.do(npkResponse);
	// console.log(`NPKResponse: ${JSON.stringify(npkResponse)}`);

	setTimeout(() => {
		// console.log("*** end response");
		log("========================= npk Request ===================================");
		log(npkRequest);
		log("=========================================================================");
		return httpRes.send(npkResponse);
	}, 500);
};

module.exports = nuguReq;