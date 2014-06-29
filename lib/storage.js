var pg = require('pg');

var storage = {};

var connectionConf = {
    host: '/tmp',
    port: 5432,
    user: 'ec2-user',
    database: 'stateHash'
};

var insertName = "insert report";
var insertText = "INSERT INTO reports (" +
                    "size, " +
                    "seed, " +
                    "sent, " +
                    "time_generation, " +
                    "time_serialization, " +
                    "object, " +
                    "time_hashing_djb2, " +
                    "hash_djb2, " +
                    "time_hashing_sdbm, " +
                    "hash_sdbm, " +
                    "time_hashing_javaHashCode, " +
                    "hash_javaHashCode, " +
                    "time_hashing_crc32, " +
                    "hash_crc32, " +
                    "rtt, " +
                    "user_agent, " +
                    "connected_clients, " +
                    "time_writing" +
                ") VALUES (" +
                    "$1,$2,$3,$4,$5,$6,$7,$8,$9," + 
                    "$10,$11,$12,$13,$14,$15,$16,$17, NULL" +
                ") RETURNING report_id;";

var updateName = "update report";
var updateText = "UPDATE reports SET time_writing = $1 WHERE report_id = $2";

var handleInsert = function (error, results, client, time_writing, done, fn) {
    if (error) {
        // handle insertion error
        fn(error);

        // truthy passed to done removes client from connection pool
        done(true);
    } else {
        // use results.rows to get the report_id
        var id = results.rows[0].report_id;

        // save time_writing to report_id.
        time_writing = Date.now() - time_writing;

        var preparedUpdate = {name: updateName,
                              text: updateText,
                              values: [time_writing, id]};

        // update report
        client.query(preparedUpdate, function (error) {
            if (error) {
                fn(error);
                done(true);
            } 
        });

        // return client to connection pool
        done();
    }
}

storage.store = function (data, fn)
{
    var time_writing = Date.now();

    //TODO move validation call and error handling here
    
    // connect to postgres server
    pg.connect(connectionConf, function(error, client, done) {
        if (error) {
            // handle db connection error by calling callback
            fn(error);
            
            // truthy passed to done removes client from connection pool
            done(true);
        } else {
            
            // store everything but the (undetermined) time_writing in the 
            // "reports" table
            var insertValues = [data.size,
                               data.seed,
                               data.sent,
                               data.time_generation,
                               data.time_serialization,
                               data.object,
                               data.time_hashing_djb2,
                               data.hash_djb2,
                               data.time_hashing_sdbm,
                               data.hash_sdbm,
                               data.time_hashing_javaHashCode,
                               data.hash_javaHashCode,
                               data.time_hashing_crc32,
                               data.hash_crc32,
                               data.rtt,
                               data.user_agent,
                               data.connected_clients];

            var preparedInsert = {name: insertName,
                                 text: insertText,
                                 values: insertValues};

            client.query(preparedInsert, function(error, results) {
                handleInsert(error, results, client, time_writing, done, fn);
            });
        }
    });
};

module.exports = storage;
