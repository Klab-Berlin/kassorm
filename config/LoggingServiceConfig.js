exports = module.exports = {
    STREAMS: [
        //{
        //    level: "warn",
        //    type: "file",
        //    path: "/tmp/raare.err.log"
        //},
        //{
        //    level: "debug",
        //    type: "file",
        //    path: "/tmp/raare.log.log"
        //},
        {
            level: "debug",
            type: "stream",
            stream: process.stdout
        }
        //,
        //{
        //    level: "warn",
        //    type: "stream",
        //    stream: process.stderr
        //}
    ]
};

exports['@literal'] = true;
