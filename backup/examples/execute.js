/*jslint node: true */
/*jshint globalstrict: true*/
'use strict';
var io = require('../index');

io.FolderLocation( __dirname);

// Call Yaml which will defined all routes with dynamic restriction 
io.Swagger('./routes.yaml');
// io.controllers('./controllers');

io.Static('./public');
io.Start(3000);