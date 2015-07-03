var Bunyan = require('bunyan');
var BunyanFormat = require('bunyan-format');
var fs = require("fs");

exports = module.exports = function (LoggingConfig) {
    var streams = LoggingConfig.STREAMS.map(function (streamConf) {
        var stream = streamConf.type == "stream" ?
            streamConf.stream : fs.createWriteStream(streamConf.path + "_" + process.pid, {flags: 'a'});

        return {
            stream: BunyanFormat({outputMode: 'short'}, stream),
            level: streamConf.level
        };
    });

    return {
        createLogger: function (loggerName) {
            return new Bunyan({
                name: loggerName,
                streams: streams
            });
        }
    };
};

exports['@singleton'] = true;
exports['@require'] = ['LoggingConfig'];
