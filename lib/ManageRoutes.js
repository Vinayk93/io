/*jslint node: true */
/*jshint globalstrict: true*/
'use strict';
var YAML = require('yamljs');
var fs = require('fs');
var writeFile = require('write-file');
var winston = require('winston');
var logger = new (winston.Logger)({
    transports: [new (winston.transports.Console)({ level: 'debug', colorize: true })]
});

var createfolder = function (filepath, callback) {
    fs.stat(filepath, function (err, stat) {
        if (err) {
            // console.log("file is not found");
            logger.warn("File Not Found", "Need to Create a New One");
            writeFile(filepath, `/*jslint node: true */
                /*jshint globalstrict: true*/
'use strict';
exports.handlers = function (event, context, callback) {
    console.log(event); //parameter passed in it
    console.log(context);
    callback(null, '{"statusCode":400,"message":"this is the response"}');
};`, function(err2) {
                if (err2) {
                    logger.error("Some Error in writing files",err2);
                    // console.log(err2);
                }else{
                    callback(filepath);
                }
            });
        } else {
            // console.log(stat);
            callback(filepath);
        }
    });
};

function DynamicContent(self, req, callback) {
    var Callfolder = req.baseUrl.replace(/\//g, "_") + req.method.toLowerCase();
    logger.debug(Callfolder);
    // logger.info(req);
    // logger.debug(self);
    // console.log(self.modules);
    if (self.modules[Callfolder] === undefined) {
        callback("There is no such folder exist", "Page Not Found");
    } else {
        //here implement try for errors in production
        // console.log(req);
        self.modules[Callfolder].handlers({"query":req.query||{},"body":req.body||{}}, {"headers":req.headers,"originalUrl":req.originalUrl,"method":req.method}, function(err, response) {
            if (err) {
                callback("There some error occured", "Server is down", 500);
            }
            try {
                response = JSON.parse(response);
            } catch (e) {
                logger.warn("Callback response need to be a JSON format",e.message);
            }
            if (response.statusCode !== undefined) {
                var statuscode = response.statusCode;
                delete response.statusCode;
                callback(null, response, statuscode);
            } else {
                logger.info(err, response);
                callback(null, response);
            }
            // if you find statuscode or code then pass it through
        });
    }
}

//====================================================================================//

var Routes = function(app) {
    this.app = app;
    this.YAML = {};
    this.modules = {};
};

Routes.prototype.Implement = function(Yaml_file, callback) {
    var self = this;
    //console.log(Yaml_file);
    /**
     * Now we need to convert yaml to json and make it to the work for all routes defined
     * align all the app routes to middlewares[multiple] and main sections
     */
    YAML.load(global.FolderLocation + "/" + Yaml_file, function(convertedYaml) {
        // console.log(convertedYaml);
        self.YAML = convertedYaml;

        var allpaths = convertedYaml.paths,
            basepath = convertedYaml.basePath,
            alltags = [],
            path = 0,
            method = "",
            filepath = "",
            folderpath = "",
            uniqueroutes = [],
            dynamic_path = "";
        for (path in allpaths) {
            // unique path with generated replace {id} to :id 
            if (/\{/.test(path)) {
                uniqueroutes.push(path);
            }
            for (method in allpaths[path]) {
                // console.log(basepath);
                folderpath = global.FolderLocation + '/controllers'; 
                dynamic_path = "/"+allpaths[path][method].tags[0] + path;
                if(basepath != undefined){
                    folderpath += basepath;
                }
                filepath = folderpath + dynamic_path +  "/" + method + ".js";
                // logger.info(path.replace(/\//g, "_") + method.toLowerCase());
                createfolder(filepath, function(return_filepath) {
                    alltags.push(return_filepath);
                });
                try {
                    self.modules[path.replace(/\//g, "_") + method.toLowerCase()] = require(filepath);
                } catch(e) {
                    // statements
                    logger.error(e);
                }
            }
        }
        //console.log(alltags);
        //now import all modules in a context
        //get all the corresonding folders in the YAML then parse it to array
        callback(uniqueroutes);
    });
};

Routes.prototype.MainAPP = function(allroutes) {
    var self = this;
    allroutes.forEach(function(data) {
        self.app.use(data.replace("{", ":").replace("}", ""), function(req, res) {
            // These are the url who is having id in the path
            req.baseUrl = data;
            //if not found the particular method then ask for the change method
            // check middleware syntax matching
            // parse 
            DynamicContent(self, req, function(err, response2, statuscode) {
                if (err) {
                    res.status(404).send(response2);
                } else {
                    res.status(statuscode || 200).send(response2).end();
                }
            });
        });
    });
    self.app.get('/', function(req, res) {
        res.send("swagger page which show all the listed api and can be modified here are available");
    });
    self.app.use('/*', function(req, res, next) {
        //console.log(req.baseUrl);
        var rx_static = /\b[\w\/]*\.[\w]*/;
        if (!rx_static.test(req.baseUrl)) {
            // now here pass another this.app but with defined url
            logger.info("Dynamic Content");
            // if not present in the system then just place it as 404            
            // swagger separate routes defined
            DynamicContent(self, req, function(err, response2, statuscode) {
                //console.log(statuscode);
                if (err) {
                    res.status(statuscode || 404).send(response2);
                } else {
                    res.status(statuscode || 200).send(response2);
                }
            });
        } else {
            logger.info("Static Content");
            // then show static content
            next();
        }
    });
};

module.exports = function(app) {
    return new Routes(app);
};