var rand = {};

rand.randomField = function (len, rng)
{
    var generator = [
        function() {
            // generate integer
            return rand.randomInt(0xfffff, rng);
        },

        function() {
            // generate double
            return 0xfffff * (rng.random() - 1);
        },

        function() {
            // generate boolean
            return rng.random() < 0.5 ? true : false;
        },

        function() {
            // generate string
            return rand.randomString(rand.randomInt(rand.randomInt(100, rng), rng), rng);
        },

        function() {
            // generate null
            return null;
        },

        function() {
            // generate undefined
            return undefined;
        },

        function() {
            // generate Infinity
            return 1/0;
        },

        function() {
            // generate NaN
            return Math.sqrt(-1);
        },

        function() {
            // generate object
            return rand.generateObject(rand.randomInt(rand.randomInt(len, rng), rng));
        },

        function() {
            // generate array
            return rand.randomArray(rand.randomInt(rand.randomInt(len, rng), rng), rng);
        }
    ];

    // generate new object field
    return generator[rand.randomInt(generator.length, rng)]();
}

rand.randomInt = function (rightBound, rng, illegal)
{
    var illegal = illegal || function () {return false;};
    var candidate = Math.floor(rng.random() * rightBound);
    return illegal(candidate) ? rand.randomInt(rightBound, rng, illegal) : candidate;
}

rand.randomString = function (size, rng)
{
    var illegalCodes = function (code) {
        if (code >= 0x0000 && code <= 0x001f) return true;
        if (code >= 0x0080 && code <= 0x009f) return true;
        return code === 0x007f;
    };

    var generatedString = '';
    for(var i = 0; i < size; i++) {
        generatedString += String.fromCharCode(rand.randomInt(0x00ff, rng, illegalCodes));
    }

    return generatedString;
}


rand.randomArray = function (length, rng)
{
    var returnArr = [];
    for (var i = 0; i < length; i++) {
        returnArr.push(rand.randomField(length, rng));
    }
    return returnArr;
}

/**
 * @param {int} number of fields generated (parent) object will have
 * @param {Object} random number generator with .random() method. defaults to Math.
 * @return {Object} random Object
 */
rand.generateObject = function (fieldCount, rng)
{
    if (rng === undefined || typeof rng.random !== 'function') rng = Math;
    var generatedObj = {};

    for(var i = 0; i < fieldCount; i++) {
        generatedObj[rand.randomString(8, rng)] = rand.randomField(fieldCount, rng);
    }
    return generatedObj;
}
