var should = require('should');

/**
 * returns true if packet parameter contains all expected data fields, and
 * each data field is of the correct data type.
 *
 * valid packets may contain extraneous fields.
 * 
 * sample valid object:
 *
 * { size: 3,
 *   seed: 3,
 *   sent: 1403316622207,
 *   time_generation: 1,
 *   time_serialization: 0,
 *   object: '{"´ÖJãoä 4":true,"p±%ts¥6G":"èÃøBfiHN°pF(sÁÆÐNA8ãb·îø$«RæÎ×e`l"}',
 *   time_hashing_djb2: 0,
 *   hash_djb2: 10961878954,
 *   time_hashing_sdbm: 0,
 *   hash_sdbm: 10668194577,
 *   time_hashing_javaHashCode: 0,
 *   hash_javaHashCode: 654439761,
 *   time_hashing_crc32: 5,
 *   hash_crc32: 3373306475,
 *   rtt: 18,
 *   user_agent: 'Mozilla something something',
 *   connected_clients: 1}
 *
 * @param {object} incoming client packet to validate
 * @return {boolean} whether or not the pac
 */
var validate = function (packet, currSeed, fn)
{
    try {
        // verify type of packet
        packet.should.be.type('object');

        // verify existence, type, and validity of each field in sample order

        packet.should.have.property('size');
        packet.size.should.be.a.Number;
        packet.size.should.equal(parseInt(packet.size));

        packet.should.have.property('seed');
        packet.seed.should.be.a.Number;
        packet.seed.should.be.above(-1);
        packet.seed.should.equal(parseInt(packet.seed));
        packet.seed.should.equal(currSeed);

        packet.should.have.property('sent');
        packet.sent.should.be.a.Number;
        packet.sent.should.be.above(-1);
        packet.sent.should.equal(parseInt(packet.sent));

        packet.should.have.property('time_generation');
        packet.time_generation.should.be.a.Number;
        packet.time_generation.should.be.above(-1);
        packet.time_generation.should.equal(parseInt(packet.time_generation));

        packet.should.have.property('time_serialization');
        packet.time_serialization.should.be.a.Number;
        packet.time_serialization.should.be.above(-1);
        packet.time_serialization.should.equal(parseInt(packet.time_serialization));

        packet.should.have.property('object');
        packet.object.should.be.a.String;
        (function(){JSON.parse(packet.object);}).should.not.throw();

        packet.should.have.property('time_hashing_djb2');
        packet.time_hashing_djb2.should.be.a.Number;
        packet.time_hashing_djb2.should.be.above(-1);
        packet.time_hashing_djb2.should.equal(parseInt(packet.time_hashing_djb2));

        packet.should.have.property('hash_djb2');
        packet.hash_djb2.should.be.a.Number;
        packet.hash_djb2.should.equal(parseInt(packet.hash_djb2));

        packet.should.have.property('time_hashing_sdbm');
        packet.time_hashing_sdbm.should.be.a.Number;
        packet.time_hashing_sdbm.should.be.above(-1);
        packet.time_hashing_sdbm.should.equal(parseInt(packet.time_hashing_sdbm));

        packet.should.have.property('hash_sdbm');
        packet.hash_sdbm.should.be.a.Number;
        packet.hash_sdbm.should.equal(parseInt(packet.hash_sdbm));

        packet.should.have.property('time_hashing_javaHashCode');
        packet.time_hashing_javaHashCode.should.be.a.Number;
        packet.time_hashing_javaHashCode.should.be.above(-1);
        packet.time_hashing_javaHashCode.should.equal(parseInt(packet.time_hashing_javaHashCode));

        packet.should.have.property('hash_javaHashCode');
        packet.hash_javaHashCode.should.be.a.Number;
        packet.hash_javaHashCode.should.equal(parseInt(packet.hash_javaHashCode));

        packet.should.have.property('time_hashing_crc32');
        packet.time_hashing_crc32.should.be.a.Number;
        packet.time_hashing_crc32.should.be.above(-1);
        packet.time_hashing_crc32.should.equal(parseInt(packet.time_hashing_crc32));

        packet.should.have.property('hash_crc32');
        packet.hash_crc32.should.be.a.Number;
        packet.hash_crc32.should.equal(parseInt(packet.hash_crc32));

        packet.should.have.property('rtt');
        packet.rtt.should.be.a.Number;
        packet.rtt.should.be.above(-1);
        packet.rtt.should.equal(parseInt(packet.rtt));

        packet.should.have.property('user_agent');
        packet.object.should.be.a.String;

        packet.should.have.property('connected_clients');
        packet.rtt.should.be.a.Number;
        packet.rtt.should.be.above(-1);
        packet.rtt.should.equal(parseInt(packet.rtt));

        // no assertion wrong, callback with no error
        fn(null);
        
    } catch (err) {
        
        // assertion error caught, callback with the error
        fn(err);
    }
};

module.exports = validate;
