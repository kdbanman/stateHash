# stateHash

notes:

- postgresql must be listening on /tmp/.s.PGSQL.5432
- init.sql will drop and create a table called reports to a database called stateHash

start/stop server:

    forever start -a -l forever.log -o out.log -e err.log srv.js
    forever stop srv.js

single page client-server application using a mersenne twister and socket.io to test javascript hashcode libraries.

from the server:

1. when the app is served to the client, it handshakes with the server's socket.io instance.
2. after the server stores the client's user agent and a sequential state ID, the first object generation command is sent.
3. after the results from an object generation command are returned, the results are extracted, processed, and stored in a database.
4. after processing and storage, a subsequent object generation command is sent.

from the client:

1. when a client receives an object generation command, it uses the command parameters to generate a random object.
2. the object is serialized.
3. the object is hashed using a variety of algorithms.
4. all operations are separately timed.
4. the hash, serialization, and timing data are sent back to the server as a `result` command
