var IoC = require('electrolyte');

var types = require('./lib/MappingsTypes');
var MappingBuilder = require("./lib/MappingBuilder");

require('./Injections'); // pushes injections

var log = IoC.create("logger").createLogger("APP");

log.info("hello");

var schema = MappingBuilder()
    .withName("schema")
    .withKeys({
        uuid: types.uuid(),
        boolean: types.boolean(),
        "list_of_text": types.list(types.text()),
        bigint: types.bigint(),
        double: types.double(),
        timestamp: types.timestamp(),
        blob: types.blob()
    })
    .build();

IoC.create("KassormConfig");
var kassorm = IoC.create("kassorm");
var TestKS = kassorm.createKeyspace("ztr");
//var AddressModel = TestKS.createType("address", addrSchema);
var PersonModel = TestKS.createModel("person", schema);

//PersonModel.save({name: "Mike"});
//PersonModel.find({name: "Mike"});


