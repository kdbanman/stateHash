var pg = require('pg'),
    q = require('q');

var storage = {};

var connectionConf = {
    host: '/tmp',
    port: 5432,
    user: 'ec2-user',
    database: 'stateHash'
};

var getClient = function (fn) {
    // connect to postgres server
    pg.connect(connectionConf, function(error, client, done) {
        if (error) {
            // handle db connection error by calling callback
            fn(error);
            // truthy passed to done removes client from connection pool
            done(true);
        } else {
            // callback with connected client
            fn(null, client);
            // release client
            done();
        }
    });
}

/*
 *   *************************
 *
 *   INSERT AND UPDATE SECTION
 *
 *   *************************
 */

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

/**
 * second stage of 2 stage write, which records the time required for the
 * first stage.
 *
 * @param {Object} results the postgres results of the initial insertion
 * @param {pg.Client} client the posttgres connection client of the pg library
 * @param {Integer} time_writing the time of the initial storage call in millis
 * @param {Function} fn the main async callback
 */
var handleInsert = function (results, client, time_writing, fn) {
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
        } 
    });
}

storage.store = function (data, fn)
{
    var time_writing = Date.now();

    //TODO move validation call and error handling here
    
    getClient(function(error, client) {
        if (error) fn(error);
        else {
            
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
                if (error) fn(error);
                else handleInsert(results, client, time_writing, fn);
            });
        }
    });
};

/*
 *   *************************
 *
 *   DISCREPANCY QUERY SECTION
 *
 *   *************************
 */

// count the total number of seeds with > 1 hashcode for a given algorithm
var perHashCountName = "per hash discrepancies";
var perHashCountText = "SELECT count(*) as total " +
                       "FROM (SELECT seed, count($1) " +
                             "FROM reports " +
                             "GROUP BY seed " +
                             "HAVING count($1) > 1) hash_discrepancies;";

/**
 * @param {String} algorithm 'djb2', 'sdbm', etc.
 * @param {Function} fn callback, passed error/null and Integer results
 */
storage.discrepancyCountTotal = function (algorithm, fn)
{
    getClient(function(err, client) {
        if (err) fn(err);
        else {
            // construct column name
            var col = 'hash_' + algorithm;

            // construct and perform prepared query
            var preparedQuery = {name: perHashCountName,
                                 text: perHashCountText,
                                 values: [col]};
            client.query(preparedQuery, function(err, results) {
                if (err) fn(err);
                else {
                    fn(null, results.rows[0].total);
                }
            });
        }
    });
}

/**
 * @param {Function} fn callback, passed error/null and results map mapping
 *                      algorithm -> discrepancy count
 */
storage.discrepancyCountTotals = function (fn)
{
    var count = q.denodeify(storage.discrepancyCountTotal);
    var all = q.all([count('djb2'),
                     count('sdbm'),
                     count('javaHashCode'),
                     count('crc_32')]);

    all.then(function (counts) {
        fn(null, {'djb2': counts[0],
                  'sdbm': counts[1],
                  'javaHashCode': counts[2],
                  'crc_32': counts[3]}
        );
    }).catch(function (err) {
        fn(err);
    });
}

// query for the number of hashcodes for each seed for a given algorithm
// seeds with only 1 hashcode are ignored, since that is good behaviour
var perSeedCountName = "per seed discrepancies";
var perSeedCountText = "SELECT seed, count($1) as discrepancy_count " +
                       "FROM reports " +
                       "GROUP BY seed " +
                       "HAVING count($1) > 1;";

/**
 * @param {String} algorithm 'djb2', 'sdbm', etc.
 * @param {Function} fn callback, passed error/null and seed -> count map
 */
storage.discrepancyCountPerSeed = function (algorithm, fn)
{
    getClient(function(err, client) {
        if (err) fn(err);
        else {
            // construct column name
            var col = 'hash_' + algorithm;

            // construct and perform prepared query
            var preparedQuery = {name: perSeedCountName,
                                 text: perSeedCountText,
                                 values: [col]};
            client.query(preparedQuery, function(err, results) {
                if (err) fn(err);
                else {
                    // construct seed -> count map
                    var seedCountMap = {};
                    results.rows.forEach(function (row) {
                        seedCountMap[row.seed] = row.discrepancy_count;
                    });

                    fn(null, seedCountMap);
                }
            });
        }
    });
}

// query for the reports of a given seed for a given algorithm, sorted by hashcode
var seedReportsName = "seed hashcodes";
var seedReportsText = "SELECT size, $2, user_agent, object " +
                      "FROM reports " +
                      "WHERE seed = $1 " +
                      "ORDER BY $2;";

/**
 * @param {String} algorithm 'djb2', 'sdbm', etc.
 * @param {Integer} seed seed number to filter by
 * @param {Function} fn callback, passed error/null and array of result maps
 *                      size, hash_algorithm, user_agent, object
 */
storage.seedReports = function (algorithm, seed, fn)
{
    getClient(function(err, client) {
        if (err) fn(err);
        else {
            // construct column name
            var col = 'hash_' + algorithm;

            // construct and perform prepared query
            var preparedQuery = {name: seedReportsName,
                                 text: seedReportsText,
                                 values: [seed, col]};
            client.query(preparedQuery, function(err, results) {
                if (err) fn(err);
                else {
                    // construct results map
                    var resultsMaps = [];
                    results.rows.forEach(function (row) {
                        var resultMap = {};
                        resultMap['size'] = row['size'];
                        resultMap[col] = row[col];
                        resultMap['user_agent'] = row['user_agent'];
                        resultMap['object'] = row['object'];

                        resultsMaps.push(resultMap);
                    });

                    fn(null, resultsMaps);
                }
            });
        }
    });
}

module.exports = storage;
