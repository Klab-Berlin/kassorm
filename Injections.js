var IoC = require('electrolyte');

IoC.register('LoggingConfig', require('./config/LoggingServiceConfig'));
IoC.register('logger', require('./lib/LoggingService'));
IoC.register('kassorm', require('./lib/kassorm'));
IoC.literal('cassanknexConfig', {
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

IoC.literal('KassormConfig', {
    ALLOW_DDL_CHANGES: true,
    // FIXME: remove after https://github.com/azuqua/cassanknex/issues/14 is fixed
    SKIP_DDL_CHANGES: true
});