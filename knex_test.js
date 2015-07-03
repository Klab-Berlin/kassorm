var Q = require('q');

require('./Injections');
var IoC = require('electrolyte');
var log = IoC.create('logger').createLogger("APP");

log.info("hello");

var cassandra = require('cassandra-driver');

var cassanKnex = require("cassanknex")({
    debug: true,
    connection: {
        contactPoints: ["127.0.0.1"]
    }
});


var callb = function (err, res) {
    if (err)
        log.error("error", err);
    else
        log.info("res", res);

};

var cql = cassanKnex("poipoi").createColumnFamilyIfNotExists("iiii");
cql.text("textType");
cql.boolean("booooo");
cql.frozen("frozen_field", "list<text>");
cql.primary("textType");

//var cql = cassanKnex("eee").createKeyspaceIfNotExists().withSimpleStrategy(1);

//cassanKnex.on("ready", cql.exec.bind(cql, callb));
cassanKnex.on("ready", function () {
    Q.nfcall(cql.exec)
        .then(log.info.bind(log))
        .catch(log.error.bind(log));
});


return;

var obj = {
    id: cassandra.types.Uuid.random(),
    name: {
        firstname: 'Marie-Claude',
        lastname: 'zzzzzzzz'
    }
    ,
    addresses: {
        home: {
            street: '191 Rue St. Charles',
            city: 'Paris',
            zip_code: 75015,
            phones: ["33", "6", "78", "90", "12", "34"]
        }
    }
};

var cql = cassanKnex("mykeyspace")
    .insert(obj)
    //.usingTimestamp(250000)
    //.usingTTL(50000)
    .into("users");


cassanKnex.on("ready", cql.exec.bind(cql, {prepare: true}, callb));
