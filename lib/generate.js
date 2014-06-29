module.exports = function (seed, N)
{
    N = N || 1;
    var size = Math.ceil(seed / N);
    size = size % 200;
    return {size: size, seed: seed};
};
