const express = require('express')
const logger = require('./log/logger')
const httpLogger = require('./log/httpLogger')
const ip = require('ip')
const app = express()
const httpPort = 3000
const apkUpdater = require('./lib/updater.js');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');
const directoryPath = path.join(__dirname, "/.apk_repo");
app.use(httpLogger)
app.use(express.json());
app.use(fileUpload({
    createParentPath: true,
    limits: {
        fileSize: 100 * 1024 * 1024 * 1024 //100MB max file size
    }
}));
apkUpdater.enable(app, '/checkupdate');

app.listen(httpPort, () =>
    logger.info(`Сервер запущен на ${ip.address()}:${httpPort}`))

app.get('/ping', (req, res) => {
    logger.info(`${req.hostname} запрос от планировщика`)
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

app.get('/files', async (req, res) => {
    fs.readdir(directoryPath, function (err, files) {
        //handling error
        if (err) {
            logger.info(`Невозможно проверить список файлов в папке: ${err}`);
            return res.json({})
        }
        res.json({files: files})
    });
})

app.delete('/files/:id', async (req, res) => {
    const {id} = req.params
    const fileToRemove = directoryPath + "\\" + id
    logger.info(`Запрос на удаление файла ${id}`)
    fs.unlink(fileToRemove, (err) => {
        if (err) {
            logger.info("Файл не найден")
            res.status(400)
                .json({message: "Файл не найден"})
        } else {
            logger.info(`Файл ${id} удалён`)
            res.json({message: `Файл ${id} удалён`})
        }
    })
})