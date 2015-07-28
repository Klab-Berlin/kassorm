var IoC = require('electrolyte');
var log = IoC.create("logger").createLogger("DB_MODEL");

var Q = require('q');

var exec = function (cql) {
    return Q.nfcall(cql.exec)
        .then(function (result) {
            //log.info(result);
            if (!result.rows || result.rows.length === 0)
                return null;
            return result.rows;
        })
        .catch(log.error.bind(log));
};

module.exports = function (qb) {
    return {
        getTable: function (keyspace, table_name) {
            var cql = qb("system")
                .select("*")
                .from("schema_columns")
                .where("columnfamily_name", "=", table_name)
                .andWhere("keyspace_name", "=", keyspace);
            return exec(cql);
        },

        getType: function (keyspace, type_name) {
            var cql = qb("system")
                .select("*")
                .from("schema_usertypes")
                .where("type_name", "=", type_name)
                .andWhere("keyspace_name", "=", keyspace);
            return exec(cql);

        }

    };

};