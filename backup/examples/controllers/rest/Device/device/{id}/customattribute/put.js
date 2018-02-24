/*jslint node: true */
                /*jshint globalstrict: true*/
'use strict';
exports.handlers = function (event, context, callback) {
    console.log(event); //parameter passed in it
    console.log(context);
    callback(null, '{"statusCode":400,"message":"this is the response"}');
};