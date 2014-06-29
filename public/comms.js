var socket = io(window.location.origin);
socket.waiting = true;

var processCommand = function (command) {
    
    // initialize object to contain hashing, serialization, and timing results
    var results = JSON.parse(JSON.stringify(command));

    var setGeneratingView = new Promise(function (resolve, reject) {
        // change status
        var statusStr = 'GENERATING OBJECT SIZE ' + command.size;
        $('.status').html(statusStr);

        // add old class from hashcodes and object
        $('#djb2').addClass('old');
        $('#sdbm').addClass('old');
        $('#javaHashCode').addClass('old');
        $('#crc32').addClass('old');
        $('#rendered').addClass('old');

        resolve();
    });

    var generateObject = function () {
        var generator = new MersenneTwister(command.seed);
        var start = Date.now();
        var generated = rand.generateObject(command.size, generator);
        results.time_generation = Date.now() - start;
        return generated;
    };

    var setSerializingView = function (generated) {
        $('.status').html('SERIALIZING OBJECT');
        return generated;
    };

    var serializeObject = function (generated) {
        var start = Date.now();
        var serialized = JSON.stringify(generated);
        results.time_serialization = Date.now() - start;
        results.object = serialized;

        var pretty = JSON.stringify(generated, null, '  ');
        $('#rendered').text(pretty);
        $('#rendered').removeClass('old');
        return generated;
    };

    var setHashingView = function (generated) {
        $('.status').html('HASHING OBJECT');
        return generated;
    };

    var hashObject = function(algorithm) {
        return function (generated) {
            var start = Date.now();
            var hashcode = esHash.hash(generated, algorithm);
            results['time_hashing_' + algorithm] = Date.now() - start;
            results['hash_' + algorithm] = hashcode;
            $('#' + algorithm).html(hashcode);
            $('#' + algorithm).removeClass('old');
            return generated;
        }
    };

    var finalizeResults = function(generated) {
        return results;
    };

    return setGeneratingView.then(generateObject)
                            .then(setSerializingView)
                            .then(serializeObject)
                            .then(setHashingView)
                            .then(hashObject('djb2'))
                            .then(hashObject('sdbm'))
                            .then(hashObject('javaHashCode'))
                            .then(hashObject('crc32'))
                            .then(finalizeResults);
}

socket.on('generate', function (command) {

    // set socket waiting state
    socket.waiting = false;
    
    // call master process
    processCommand(command).then(function (results) {

        // report to server
        $('.status').html('REPORTING TO SERVER');

        socket.emit('result', results, function () {
            if (socket.waiting) $('.status').html('WAITING ON SERVER');
        });

        // set socket to waiting 
        socket.waiting = true;

    }, function (error) {
        socket.emit('hashState error', error);
        reportError(error);
    });
});

var reportError = function (err)
{
    socket.waiting = false;
    $('.error').removeClass('invisible');

    var $li = $('<li></li>');
    $li.text(JSON.stringify(err));

    $('.errorlist').append($li);
    console.log(err);
};

socket.on('error', reportError);
socket.on('server error', reportError);
