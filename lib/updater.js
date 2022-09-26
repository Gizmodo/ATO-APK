'use strict';
const {v4: uuidv4} = require('uuid'),
    reader = require('./apkReader'),
    moment = require('moment'),
    logger = require('../log/logger.js')

const linkTTL = moment.duration(4, 'hour').asMilliseconds()

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
                    if (expressApp._router && expressApp._router.stack) {
                        for (idx in expressApp._router.stack) {
                            if (expressApp._router.stack[idx].route) {
                                if (expressApp._router.stack[idx].route.path === links[key].url) {
                                    expressApp._router.stack.splice(idx, 1)
                                    logger.info("Ссылка " + links[key].url + " на скачивание удалена")
                                    break;
                                }
                            }
                        }
                    }
                    links[key] = null;
                }, linkTTL)
            };
            expressApp.get(links[key].url, function (req, res) {
                res.download(last.filepath, function (err) {
                    if (err) {
                        logger.error(err)
                    } else {
                        logger.info("Файл успешно отправлен")
                    }
                })
            });
        }
        logger.info("Для версии " + version + " есть обновление до " + last.version + " по ссылке " + links[key].url);
        res.json({
            url: links[key].url,
            version: last.version
        })
    } else {
        logger.info("Нет обновлений для " + name + " - " + version + " / Последняя версия : " + last);
        const errorCode = 400
        res.status(errorCode)
            .json({
                status:"fail",
                message: "Нет обновлений для " + name + " - " + version,
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
