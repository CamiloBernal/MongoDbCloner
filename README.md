# Mongo Db Cloner
Clone mongodb server (all databases, all collections) with NodeJs and Native MongoDb driver for NodeJs

Inspired in Tom Garden (https://github.com/RandomEtc) gist: https://gist.github.com/RandomEtc/1219665.

#Presumptions
- Must drop all collections each database on the target server before performing cloning. This, in order to avoid the errors mentioned in: https://docs.mongodb.com/manual/reference/method/db.copyDatabase/ when the collection already exists on the target server)
- For now, both the source and target server must allow connections without authentication. You can fork and help with this.
- Databases "admin" and "local" from the list of databases to be cloned are excluded.

#To-Do
 - Refactor, refactor, refactor :P
 - Add auth support
 - Fix console log freezing
 - Correct the horrible English in the readme. (Sorry, my English is terrible, barely speak my native language, Spanish).
