const express = require('express')
const logger = require('./log/logger')
const httpLogger = require('./log/httpLogger')
const ip = require('ip')
const app = express()
const httpPort = 3000
const apkUpdater = require('./lib/updater.js');
const fileUpload = require('express-fileupload');

app.use(httpLogger)
app.use(express.json());
app.use(fileUpload({
    createParentPath: true,
    debug: true,
    limits: {
        fileSize: 100 * 1024 * 1024 * 1024 //100MB max file size
    }
}));
apkUpdater.enable(app, '/checkupdate');

app.listen(httpPort, () =>
    logger.info('Сервер запущен на ' + ip.address() + ':' + httpPort))

app.get('/ping', (req, res) => {
    logger.info(req.hostname + " запрос от планировщика")
    res.json("pong")
})
app.post('/upload', async (req, res) => {
    try {
        if (!req.files) {
            res.send({
                status: false,
                message: 'Файл не получен'
            });
        } else {
            let apk = req.files.apk;
            await apk.mv("./.apk_repo/" + apk.name);
            res.send({
                status: true,
                message: 'Файл получен',
                data: {
                    name: apk.name,
                    mimetype: apk.mimetype,
                    size: apk.size
                }
            });
        }
    } catch (err) {
        res.status(500).send(err);
    }
});