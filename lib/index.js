/*jslint node: true */
/*jshint globalstrict: true*/
'use strict';

var express = require('express');
var app = express();
var path = require('path');
/**
 * This library modules require
 */
var Routes = require('./ManageRoutes.js')(app);
var MainServer = require('./ManageServer.js')(app);
var Validation = require('./ManageValidation.js');
var DB = require('./ManageDB.js');

// console.log(Routes);
module.exports = {
    "Swagger": function (args) {
        // console.log(args);
        Routes.Implement(args, function (result) {
            Routes.MainAPP(result);
            //console.log(result);
        });
        // now create there folders for check if codes are present if not then just forward
    },
    "Start": function (port) {
        // console.log(port); 
        MainServer.start(port);
    },
    "Valid": function (args) {//console.log(args);
        Validation.check(args);
    },
    "FolderLocation": function (args) { global.FolderLocation = args; },
    "Static": function (args) {
        // console.log(args);
        app.use(express.static(path.join(global.FolderLocation, args)));
        // app.use(express.static(args));
    }
};
