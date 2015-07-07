var IoC = require('electrolyte');

var types = require('./lib/MappingsTypes');
var MappingBuilder = require("./lib/MappingBuilder");

require('./Injections'); // pushes injections

var log = IoC.create("logger").createLogger("APP");

log.info("hello");

var addressSchema = MappingBuilder()
    .withName("address")
    .withKeys({
        uuid: types.uuid(),
        street: types.text(),
        city: types.text()
    })
    .build();

var schema = MappingBuilder()
    .withName("schema")
    .withKeys({
        uuid: types.partition_key(types.uuid(), 0),
        boolean: types.boolean(),
        "list_of_text": types.list(types.text()),
        bigint: types.bigint(),
        double: types.index(types.double()),
        timestamp: types.timestamp(),
        blob: types.blob(),
        address: types.nested(addressSchema)
    })
    .build();


IoC.create("KassormConfig");
var kassorm = IoC.create("kassorm");
var TestKS = kassorm.createKeyspace("zzz");

var AddressModel = TestKS.createType("address", addressSchema);
AddressModel.isReady().then(function () {
    var PersonModel = TestKS.createModel("person", schema);
    var Uuid = require('cassandra-driver').types.Uuid;
    var id = Uuid.random();

    PersonModel.save({
        uuid: id,
        boolean: true,
        "list_of_text": ["aaa", "bbb", "ccc"],
        bigint: 9999,
        double: 222.222,
        timestamp: Date.now(),
        blob: new Buffer("ppp"),
        address: {
            uuid: id,
            street: "str",
            city: "ct"
        }
    }).then(log.info.bind(log, "OK!")).catch(log.error.bind(log));

    PersonModel.find({uuid: id}).then(log.info.bind(log, "OK!")).catch(log.error.bind(log));

    PersonModel.find({uuid: id}).then(function (res) {
        var r = res.rows[0];
        log.info(r.address);
        log.info(r.list_of_text);
    });

});

