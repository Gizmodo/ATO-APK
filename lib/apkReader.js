'use strict';

const fs = require('fs')
    , _ = require('underscore');

/** Contains apk definitions. */
let apk = {}
    , initialized = false
    , repoDir = '.apk_repo'
    /** APK filenames pattern. */
    , apkPattern = /([\w.]+)-(\d+\.\d+\.\d+\.BN-\d+)\.apk/;


function init() {
    let files;
    try {
        files = fs.readdirSync(repoDir, 'utf8');
    } catch (e) {
        console.log("Cannot read apk repository directory : " + repoDir);
        return;
    }

    function addApk(file) {
        if (apkPattern.test(file)) {
            if (!apk[RegExp.$1]) {
                apk[RegExp.$1] = [];
            }
            apk[RegExp.$1].push({
                'version': RegExp.$2,
                'filename': file,
                'filepath': repoDir + '/' + file
            });
            // console.log("New APK : " + RegExp.$1 + "\n" + JSON.stringify(apk[RegExp.$1]));
            apk[RegExp.$1] = _.sortBy(apk[RegExp.$1], function (def) {
                return def.version;
            });
        }
    }

    function removeApk(file) {
        if (apkPattern.test(file)) {
            if (!apk[RegExp.$1]) {
                apk[RegExp.$1] = [];
            }
            apk[RegExp.$1] = _.reject(apk[RegExp.$1], function (def) {
                return def.filename === file;
            });
        }
    }

    _.each(files, addApk);

    fs.watch(repoDir, function (event, filename) {
        let i, filepath = repoDir + '/' + filename;
        if (event === 'rename') {
            if (fs.existsSync(filepath)) {
                // file created or renamed
                for (i in apk) {
                    apk[i] = _.filter(apk[i], function (def) {
                        return fs.existsSync(repoDir + '/' + def.filename);
                    });
                }
                addApk(filename);
            } else {
                // file deleted
                removeApk(filename);
            }
        }
    });

    initialized = true;
}

/**
 * Returns all available apk files.
 */
function available(name) {
    if (!initialized) {
        init();
    }
    if (name)
        return apk[name];
    return apk;
}

/**
 * Returns last (version) apk for provided name.
 */
function last(name) {
    if (!initialized) {
        init();
    }
    return _.last(apk[name]);
}

/**
 * Change directory where new APK files are located.
 */
function setRepoDir(path) {
    repoDir = path;
    init();
}

/**
 * Module exports.
 */
module.exports = {
    'available': available
    , 'last': last
    , 'setRepoDir': setRepoDir
}
