require('./Injections');
var IoC = require('electrolyte');
var log = IoC.create('logger').createLogger("APP");

log.info("hello");

var cassandra = require('cassandra-driver');
var Joi = require('joi');


////region schema description
//var address_schema = Joi.object().keys({
//    city: Joi.string().required(),
//    street: Joi.string()
//});
//
//log.info(address_schema.describe());
////endregion


//var values = {
//    user_name: "mmmmmmmm",
//    password: "sssssss"
//};


var cassanKnex = require("cassanknex")({
    //debug: true,
    connection: {
        contactPoints: ["127.0.0.1"]
    },
    exec: {
        prepare: true,
        autoPage : true
    }
});


cassanKnex.on("ready", function (err) {
    if (err)
        log.error("Error Connecting to Cassandra Cluster", err);
    else {
        log.info("Cassandra Connected");


        //for (var i = 0; i < 10000; ++i) {
        //    (function(){
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

                cassanKnex("mykeyspace")
                    .insert(obj)
                    //.usingTimestamp(250000)
                    //.usingTTL(50000)
                    .into("users")
                    .exec({prepare: true}, callb);
            //})();
        //
        //}

        //var i = 0;
        //var qb = cassanKnex("mykeyspace")
        //    .select()
        //    .from("users");
        ////qb.exec({prepare: true}, callb);
        //qb
        //    .eachRow({prepare: true, autoPage : true}, function (index, row, totalInPage) {
        //    log.info(++i);
        //    //log.info(index, row, totalInPage);
        //}, function (e, result) {
        //    if (e) {
        //        log.error(e);
        //        throw e;
        //    }
        //    log.info(result.pageState);
        //});
    }
});

var callb = function (err, res) {
    if (err)
        log.error("error", err);
    else
        log.info("res", res);

};
