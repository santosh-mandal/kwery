const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/";
module.exports = function db() {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, function (err, db) {
            var dbo = db.db("dost4u");
            resolve(dbo);
        });

    });
}