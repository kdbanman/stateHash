/*
Run this script against an existing stateHash database to drop and create
`reports` table and primary key sequence `report_sequence`
*/

DROP TABLE IF EXISTS reports;
DROP SEQUENCE IF EXISTS report_sequence;

CREATE SEQUENCE report_sequence;
CREATE TABLE reports (
    report_id INT4 DEFAULT nextval('report_sequence') NOT NULL,
    size integer NOT NULL,
    seed integer NOT NULL,
    sent bigint NOT NULL,
    time_generation integer NOT NULL,
    time_serialization integer NOT NULL,
    object json NOT NULL,
    time_hashing_djb2 integer NOT NULL,
    hash_djb2 bigint NOT NULL,
    time_hashing_sdbm integer NOT NULL,
    hash_sdbm bigint NOT NULL,
    time_hashing_javaHashCode integer NOT NULL,
    hash_javaHashCode bigint NOT NULL,
    time_hashing_crc32 integer NOT NULL,
    hash_crc32 bigint NOT NULL,
    rtt integer NOT NULL,
    user_agent text,
    connected_clients integer,
    time_writing integer,
    PRIMARY KEY (report_id)
);

/*
------------------------------------------------------
intended retrieval for followup time_writing addition:
------------------------------------------------------

INSERT INTO reports (size, seed, sent, ...)
VALUES (3, 3, 1403316622207, ...)
RETURNING report_id;

-------------------
with node-postgres:
-------------------

var pg = require("pg");

var queryName = "insert report";
var queryText = "INSERT INTO reports (size, seed, sent, ...) " +
                "VALUES ($1, $2, $3, ...) " +
                "RETURNING report_id;";

pg.connect("conninfo", function(error, client, done) {
    if (error) {
        // handle db connection error

        // truthy passed to done removes client from connection pool
        done(true);
    } else {
        var preparedQuery = {name: queryname,
                             text: queryText,
                             values: [3, 3, 1403316622207, ...]};
        client.query(preparedQuery, function(error, results) {
            if (error) {
                // handle insertion error

                // truthy passed to done removes client from connection pool
                done(true);
            } else {
                // use results.rows to get the report_id

                // return client to connection pool
                done();
            }
        });
    }
});

*/
