var url = require('url'),
    mongodb = require('mongodb');

var sourceUrl = 'mongodb://user:pass@host:port/db',
    targetUrl = 'mongodb://user:pass@host:port/db',
    collectionName = 'my_awesome_collection';

function openDbFromUrl(mongoUrl, cb) {
    var dbUrl = url.parse(mongoUrl),
        dbName = dbUrl.pathname.slice(1), // no slash
        dbServer = new mongodb.Server(dbUrl.hostname, dbUrl.port, { auto_reconnect: true }),
        db = new mongodb.Db(dbName, dbServer, {});
    db.open(function(err, client) {
        if (dbUrl.auth) {
            var dbAuths = dbUrl.auth.split(":"),
                dbUser = dbAuths[0],
                dbPass = dbAuths[1];
            db.authenticate(dbUser, dbPass, function(err) {
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

function copyCollection(source, target, collectionName, cb) {
    source.collection(collectionName, function(err1, sourceCollection) {
        if (err1) {
            console.error("error opening source collection");
            cb(err1);
        }
        else {
            target.collection(collectionName, function(err2, targetCollection) {
                if (err2) {
                    console.error("error opening target collection");
                    cb(err2);
                }
                else {
                    // Note: if this fails it's because I was lazy and used toArray
                    // try .each() and insert one doc at a time? (do a count() first so you know it's done)
                    sourceCollection.find().toArray(function(err3, results) {
                        if (err3) {
                            console.error("error finding source results");
                            cb(err3);
                        }
                        else {
                            targetCollection.insert(results, { safe: true }, function(err4, docs) {
                                if (err4) {
                                    console.error("error inserting target results");
                                    cb(err4);
                                }
                                else {
                                    cb(null, docs.length + " docs inserted");
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}

openDbFromUrl(sourceUrl, function(err1, source) {
    if (err1) {
        console.error("error opening source db");
        console.error(err1);
        process.exit(1);
    }
    else {
        openDbFromUrl(targetUrl, function(err2, target) {
            if (err2) {
                console.error("error opening target db");
                console.error(err2);
                process.exit(1);
            }
            else {
                copyCollection(source, target, collectionName, function(err3, result) {
                    if (err3) {
                        console.error("error copying collection");
                        console.error(err3);
                        process.exit(1);
                    }
                    else {
                        console.log(result);
                        process.exit(0);
                    }
                });
            }
        });
    }
});
