var IoC = require('electrolyte');

var types = require('./lib/MappingsTypes');
var MappingBuilder = require("./lib/MappingBuilder");

require('./Injections'); // pushes injections

var log = IoC.create("logger").createLogger("APP");

log.info("hello");

var addressSchema = MappingBuilder()
    .withName("schema")
    .withKeys({
        uuid: types.primary(types.uuid()),
        street: types.boolean(),
        city: types.text()
    })
    .build();

var schema = MappingBuilder()
    .withName("schema")
    .withKeys({
        uuid: types.primary(types.uuid()),
        boolean: types.boolean(),
        "list_of_text": types.list(types.text()),
        bigint: types.bigint(),
        double: types.double(),
        timestamp: types.timestamp(),
        blob: types.blob(),
        address: types.nested(addressSchema)
    })
    .build();


IoC.create("KassormConfig");
var kassorm = IoC.create("kassorm");
var TestKS = kassorm.createKeyspace("ztr");

var PersonModel = TestKS.createModel("person", schema);
var AddressModel = TestKS.createModel("address", addressSchema);

var Uuid = require('cassandra-driver').types.Uuid;
var id = Uuid.random();

PersonModel.save({
    uuid: id,
    boolean: true,
    "list_of_text": ["aaa", "bbb", "ccc"],
    bigint: 9999,
    double: 222.222,
    timestamp: Date.now(),
    blob: new Buffer("ppp")
}).then(log.info.bind(log, "OK!")).catch(log.error.bind(log));
//PersonModel.find({name: "Mike"});

PersonModel.find({uuid: id}).then(log.info.bind(log, "OK!")).catch(log.error.bind(log));

