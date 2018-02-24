/**
 * Server initalisation
 * Server security 
 */
/*jslint node: true */
/*jshint globalstrict: true*/
'use strict';
var morgan = require('morgan');
var fs = require('fs');
var path = require('path');
var winston = require('winston');
var logger = new (winston.Logger)({
    transports: [new (winston.transports.Console)({ level: 'debug', colorize: true })]
});

var Server = function (app) {
    this.app = app;
};

Server.prototype.start = function (port) {
    try {
        if (!fs.existsSync(global.FolderLocation + '/logs/')) {
            fs.mkdirSync(global.FolderLocation + '/logs/');
            logger.info("Requests Log are generated on", global.FolderLocation + '/logs/');
        }
        // fs.mkdirSync(global.FolderLocation + '/logs/');
    } catch (e) {
        // statements
        logger.warn(e);
    }
    try {
        this.app.listen(port);
        logger.info("Server Started on port", port);
    } catch (e) {
        // statements
        logger.warn(e);
    }
    //now all cnfiured part here
    this.app.use(morgan('dev', {
        skip: function (req, res) {
            logger.info(req.query || req.body);
            return res.statusCode < 400;
        }
    }));
// log all requests to access.log
    this.app.use(morgan('common', {
        stream: fs.createWriteStream(path.join(global.FolderLocation, '/logs/access.log'), {flags: 'a'})
    }));
};

module.exports = function (app) {
    return new Server(app);
};