const express = require('express')
const logger = require('./log/logger')
const httpLogger = require('./log/httpLogger')
const ip = require('ip')
const app = express()
const httpPort = 3000
const apkUpdater = require('./lib/updater.js');

app.use(httpLogger)
app.use(express.json());
apkUpdater.enable(app, '/checkupdate');

app.listen(httpPort, () =>
    logger.info('Сервер запущен на ' + ip.address() + ':' + httpPort))

app.get('/ping', (req, res) => {
    logger.info(req.hostname + " запрос от планировщика")
    res.json("pong")
})