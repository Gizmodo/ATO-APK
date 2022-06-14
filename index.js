const express = require('express')
const logger = require('./log/logger')
const httpLogger = require('./log/httpLogger')

const app = express()
const httpPort = 3000
const apkUpdater = require('./lib/updater.js');

app.use(httpLogger)
app.use(express.json());
apkUpdater.enable(app, '/checkupdate');

app.listen(httpPort, () =>
    logger.info('Express.js listening on port 3000.'))

app.get('/ping', (req, res) => {
    logger.info(req.hostname + " пинг от PeriodicWorker")
    res.json("pong")
})