'use strict';
const {v4: uuidv4} = require('uuid');
const
    winston = require('winston'),
    reader = require('./apkReader');
const HOUR = 3600000;

let androidUpdate = {}
    , expressApp
    , routePfx
    , links = [];

androidUpdate.updater = function (req, res) {
    let name = req.body.pkgname,
        version = req.body.version,
        last = reader.last(name),
        key;
    if (last && last.version > version) {
        key = name + "-" + version;
        if (!links[key]) {
            links[key] = {
                url: routePfx + '/' + uuidv4(),
                timeoutId: setTimeout(function () {
                    let idx;
                    for (idx in expressApp.routes.get) {
                        if (expressApp.routes.get[idx].path === links[key].url) {
                            expressApp.routes.get.splice(idx, 1);
                            break;
                        }
                    }
                    links[key] = null;
                }, 4 * HOUR)
            };
            expressApp.get(links[key].url, function (req, res) {
                res.download(last.filepath, function (error) {
                    console.log("Error : ", error)
                });
            });
        }
        winston.info("Есть обновление для версии " + version + "\n" + links[key].url + "\n" + last.version);
        res.json({
            url: links[key].url,
            version: last.version
        })
    } else {
        winston.info("Нет обновлений для " + name + " - " + version + " / Последняя версия : " + last);
        const errorCode = 400
        res.status(errorCode)
            .json({
                error: {
                    code: errorCode,
                    message: "Нет обновлений для " + name + " - " + version
                }
            });
    }
}

function enable(app, route, repoDir) {
    expressApp = app;
    routePfx = route;
    if (repoDir) {
        reader.setRepoDir(repoDir);
    }
    app.post(route, androidUpdate.updater);

    app.get(route, function (req, res) {
        res.send(reader.available());
    });
}

module.exports = {
    'enable': enable
}
