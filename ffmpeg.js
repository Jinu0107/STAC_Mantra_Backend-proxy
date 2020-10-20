var ffmpeg = require('ffmpeg');
var audioconcat = require('audioconcat');
var fs = require('fs');
var path = require('path');

// let param = { file : "data/intro.mp3", start : 10 , duration : 36 , path : "test/test.mp3" };
// saveAudio(param);


function saveAudio({ file, start, duration, path }) {
    return new Promise((res, rej) => {
        let process = new ffmpeg(file);
        process.then(
            function (video) {

                let videoDuration = video.metadata.duration.seconds;
                if (duration === "end") duration = videoDuration - start;

                video
                    .setVideoStartTime(start)
                    .setVideoDuration(duration)
                    .save(path, function (err, file) {

                        if (!err) {
                            console.log('Audio File : ' + file);
                            res(file);
                        }
                        else console.log("Error : " + err);
                    });
            },
            function (err) { console.log("process then error : " + err) }
        )
    });
}

function repeatAudioAndGetPath({ file, cnt }) {

    return new Promise((res, rej) => {

        const SAVE_PATH = `music/${Math.random().toString(36).substring(2)}.mp3`;
        let songs = [];
        for (let i = 0; i < cnt; i++) songs.push(file);

        audioconcat(songs).concat(SAVE_PATH)
            .on('start', function (command) {

                console.log('ffmpeg process started : ', command);

            })
            .on('error', function (err, stdout, stderr) {

                console.log('Error : ', err);
                console.log('ffmpeg stderr : ', stderr);
                rej(err);

            }).on('end', function (output) {

                console.log('Audio created in : ' + SAVE_PATH);
                res(SAVE_PATH);

            });
    });

}

function vacateMusic() {

    const DIR = "music";
    let frame = setInterval(() => {
        console.log("============== START VACATE MUSIC DIR ==============");
        fs.readdir(DIR, async (err, files) => {
            if (err) {
                console.log("Error : " + err);
                console.log("============== END VACATE MUSIC DIR ==============");
            }
            else {
                await clean(DIR, files);
                console.log("============== END VACATE MUSIC DIR ==============");
            }
        });

        function clean(DIR, files) {
            return new Promise((res, rej) => {
                let reg = /(.*?)\.(mp3)$/;
                for (let i = 0; i < files.length; i++) {

                    let file = files[i];
                    let target = path.join(DIR, file);

                    if (!reg.test(file)) {
                        if (i === files.length - 1) res(i);
                        continue;
                    }
                    else {
                        fs.unlink(target, err => {
                            if (err) console.log("Error :" + err);
                            else console.log(" File Delete : " + target);
                            if (i === files.length - 1) res(i);
                        });
                    }
                }
            });

        }

    }, 1000 * 60 * 60);
}

function getMedidation(minute) {
    minute *= 1;

    let bgmMinute = minute - 3;
    const START_SOUND_FILE_NAME = "./music/meditation/start_meditation.mp3";
    const BGM_SOUND_FILE_NAME = "./music/white_noise/wave.mp3";
    const END_SOUND_FILE_NAME = "./music/meditation/end_meditation.mp3";

    let songs = [START_SOUND_FILE_NAME];
    for (let i = 0; i < bgmMinute; i++) songs.push(BGM_SOUND_FILE_NAME);
    songs.push(END_SOUND_FILE_NAME);
    return new Promise((res, rej) => {

        const SAVE_PATH = `./music/${Math.random().toString(36).substring(2)}.mp3`;
        audioconcat(songs).concat(SAVE_PATH)
            .on('start', function (command) {

                console.log('ffmpeg process started : ', command);

            })
            .on('error', function (err, stdout, stderr) {

                console.log('Error : ', err);
                console.log('ffmpeg stderr : ', stderr);
                rej(err);

            }).on('end', function (output) {

                console.log('Audio created in : ' + SAVE_PATH);
                res(SAVE_PATH);

            });
    });

}

function getSleep(minute) {
    minute *= 1;
    let bgmMinute = minute - 3;
    console.log(bgmMinute);
    
    const START_SOUND_FILE_NAME = "music/sleep/start_sleep.mp3";
    const BGM_SOUND_FILE_NAME = "music/white_noise/rain.mp3";

    let songs = [];
    songs.push(START_SOUND_FILE_NAME);
    for (let i = 0; i < bgmMinute; i++) songs.push(BGM_SOUND_FILE_NAME);
    console.log(songs);
    return new Promise((res, rej) => {

        const SAVE_PATH = `./music/${Math.random().toString(36).substring(2)}.mp3`;
        audioconcat(songs).concat(SAVE_PATH)
            .on('start', function (command) {

                console.log('ffmpeg process started : ', command);

            })
            .on('error', function (err, stdout, stderr) {

                console.log('Error : ', err);
                console.log('ffmpeg stderr : ', stderr);
                rej(err);

            }).on('end', function (output) {

                console.log('Audio created in : ' + SAVE_PATH);
                res(SAVE_PATH);

            });
    });

}

module.exports.saveAudio = saveAudio;
module.exports.repeatAudioAndGetPath = repeatAudioAndGetPath;
module.exports.vacateMusic = vacateMusic;
module.exports.getMedidation = getMedidation;
module.exports.getSleep = getSleep;