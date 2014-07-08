# stateHash

### 04 July 2014

stateHash is the first testing-phase project of [gameruum](http://gameruum.io).
It isn't meant to be pretty, but it does have some goals.
The main goal was to get object generation and hashing to behave identically accross as many browsers as possible.
Secondary goals were mostly educational, as the author (me!) wanted to increase his experience with error handling and architectural styles in the mutual context of socket.io, the node.js asynchronous environment, and a SQL database.

Unexpected learning tangents were dense and intense.
In no particular order, I was anywhere between steeped and sipping the following:

- the express web framework
- asynchronous promises
- linux services
- ssh port forwarding
- jquery
- css
- live deployment
- github webhooks
- client-server state management
- nginx
- reverse proxying
- load balancing
- hashcodes
- pseudorandom number generation

The results of the experiment, in short, are that the browser-side object hash algorithms are behaving consistently, and that the object generation algorithm may not be as deterministic as hoped.
How are the hashing algorithms consistent?
They all exhibit the same number of discrepancies!
That is, they all hashed the same number of object seeds differently in different contexts.
That isn't desirable behavior, but the problem isn't necessarily with the hashing algorithms.
The object generation algorithm appears to be generating different objects for a given seed, depending upon the browser context.

Once the object generator is generating uniformly accross all contexts, this testing can resume to verify the consistency *and* correctness of the hashing algorithms.
For now, though, stateHash will lie dormant in its current state.

Uniform object generation will be the subject of the second testing-phase project of gameruum.
The goal is to learn about the states of a synchronization room by generating objects from common seeds in lock-step sync across multiple browsers at the same time.
By watching each step of object generation, I should be able to pinpoint the cause of desynchronization.
But more importantly, alpha-esque scaffolding for a room of connected, synchronized clients will be laid for reference.

## TODO

<!-- -->

- clear and gather results again after hashStep has completed

<!-- -->

- write and expose query for fastest hash algorithm

<!-- -->

- update blog post

<!-- -->

- use a session store module and include session ID in each report

<!-- -->

- include richer object data in each report
    - number of object fields
    - serialization length
    - object size in bytes (?)

## database notes:

- `postgresql` with `stateHash` db must be listening on unix domain socket `/tmp/.s.PGSQL.5432`
- `init.sql` will drop and create a table called `reports` to a database called `stateHash`

## start/stop app server:

    forever start -a -l forever.log -o out.log -e err.log srv.js
    forever stop srv.js

## about

this is a single page client-server application using a mersenne twister and socket.io to test javascript hashcode libraries.

a sequence of object generation commands are sent in real time from the server to the client as per the command sequence documented below.

### command sequence

each client receives the same sequence of generation commands in the same order.

the sequence of commands maps to a sequence of objects, a sequence of hashcodes, and a sequence of time deltas:

    {command_1,     command_2,      ...,    command_N}

    -- maps to client-generated sequences -->

        {object_1,      object_2,       ...     object_N}
        {hashcodes_1,   hashcodes_2,    ...     hashcodes_N}
        {time_deltas_1, time_deltas_2,  ...     time_deltas_N}

### intended behavior

each command in the sequence should produce the same behavior across all browsers and client contexts.

that is, `command_1` should produce the same behavior across all contexts, but `command_1` should produce different behaviour than `command_2`.

1. if the pseudorandom number generator and object generator are behaving correctly, each command in the sequence should deterministically generate the same object.
2. if the hashing algorithms are behaving correctly, each object should be hashed to the same set of hashcodes.

#### the server's perspective

1. when the app is served to the client, it handshakes with the server's socket.io instance.
2. after the handshake, the first object generation command is sent to the client.
3. after the results from an object generation command are received, the results are validated and stored in a database.
4. after validation and storage, a subsequent object generation command is sent, starting the cycle again.

#### the client's perspective

1. when a client receives an object generation command, it uses the command parameters to generate a pseudorandom object.
2. the object is serialized.
3. the object is hashed using a variety of algorithms.
4. all operations are separately timed.
5. the hash, serialization, and timing data are sent back to the server as a single results packet.
