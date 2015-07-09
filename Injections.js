var IoC = require('electrolyte');

IoC.register('LoggingConfig', require('./config/LoggingServiceConfig'));
IoC.register('logger', require('./lib/LoggingService'));
IoC.register('kassorm', require('./lib/kassorm'));
IoC.literal('KassormConfig', {
    connection: {
        contactPoints: ["127.0.0.1"]
        //,
        //sslOptions:{}
    }
    //,
    //debug: true
    ,
    debug: false
});

