var url = require('url'),
    mongodb = require('mongodb');


var sourceUrl = 'mongodb://localhost:27017/admin',
    targetUrl = 'mongodb://localhost:2728/admin';


var getMongoUrlInfo = function (mongoUrl) {
    "use strict";
    var dbUrl = url.parse(mongoUrl);
    return {host: dbUrl.hostname, port: dbUrl.port};
};


function openDbFromUrl(mongoUrl, cb) {
    var dbUrl = url.parse(mongoUrl),
        dbName = dbUrl.pathname.slice(1), // no slash
        dbServer = new mongodb.Server(dbUrl.hostname, dbUrl.port, {auto_reconnect: true}),
        db = new mongodb.Db(dbName, dbServer, {});
    db.open(function (err, client) {
        if (dbUrl.auth) {
            var dbAuths = dbUrl.auth.split(":"),
                dbUser = dbAuths[0],
                dbPass = dbAuths[1];
            db.authenticate(dbUser, dbPass, function (err) {
                if (err) {
                    console.error("db wouldn't authenticate");
                    cb(err);
                }
                else {
                    cb(null, client);
                }
            });
        }
        else {
            if (err) {
                console.error("db wouldn't open");
                cb(err);
            }
            else {
                cb(null, client);
            }
        }
    });
}

function getServerCollections(excludeList, db, callBack) {
    "use strict";
    if (db) {
        db.command({"listDatabases": 1}).then(function (data) {
            if (data) {
                var databases = data.databases;
                var requestedDatabases = [];
                databases.forEach(function (database, index, array) {
                    if (excludeList.indexOf(database.name) < 0) {
                        requestedDatabases.push(database.name);
                    }
                });
                callBack(requestedDatabases);
            } else {
                callBack(null);
            }
        });
    } else {
        console.error("db wouldn't open");
    }
}

function cloneDatabases(databaseNames, sourceServerUrl, db, callBack) {
    "use strict";
    if (db) {
        var sourceInfo = getMongoUrlInfo(sourceServerUrl);
        var fromHost = `${sourceInfo.host}:${sourceInfo.port}`;
        console.log(`Cloning from host: ${fromHost}`);
        var admin = db.admin();
        databaseNames.forEach(function (databaseName, index, array) {
            var mongoCommand = {copydb: 1, fromhost: fromHost, fromdb: databaseName, todb: databaseName};
            console.log(`Trying clone database ${databaseName}`);
            admin.command(mongoCommand, function (commandErr, data) {
                if (!commandErr) {
                    console.log(`${databaseName} database cloned successfully`);
                    console.log(data);
                } else {
                    console.log(commandErr.errmsg);
                }
                if (index === (databaseNames.length - 1)) {
                    db.close();
                    callBack();
                }
            });
        });
    } else {
        console.error("db wouldn't open");
    }
};

openDbFromUrl(sourceUrl, function (err, source) {
    "use strict";
    if (err) {
        console.error("error opening source db");
        console.error(err);
        process.exit(1);
    } else {
        var excludeList = ["admin", "local"];
        getServerCollections(excludeList, source, function (databaseList) {
            source.close(true);
            openDbFromUrl(targetUrl,function(err2,target){
                if(err2){
                    console.error("error opening target db");
                    console.error(err2);
                    process.exit(1);
                }else{
                    cloneDatabases(databaseList,sourceUrl,target,function(){
                        console.log("Ended process");
                        process.exit(1);
                    });
                }
            });
        });
    }
});