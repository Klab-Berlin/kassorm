var IoC = require('electrolyte');

IoC.register('LoggingConfig', require('../../config/LoggingServiceConfig'));
IoC.register('logger', require('../../lib/LoggingService'));
IoC.register('kassorm', require('../../lib/kassorm'));
IoC.literal('cassanknexConfig', {
    connection: {
        contactPoints: ["cassandra"]
        //,
        //sslOptions:{}
    }
    //,
    //debug: true
    ,
    debug: false
});

IoC.literal('KassormConfig', {
    ALLOW_DDL_CHANGES: true,
    SKIP_DDL_CHANGES: false
});