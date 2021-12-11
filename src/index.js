"use strict";
const { TEDIOUS_MSSQL_DEBUG } = process.env;
var Connection = require("tedious").Connection;
var Request = require("tedious").Request;
const { TYPES } = require("tedious");

module.exports = class TediousMssql {
  constructor(conf) {
    //conf.options = conf.options || {};
    this.config = conf;
    this.config.options = conf.options || {};
    this.config.authentication = conf.authentication || {};

    if (this.config.options) {
      this.config.options.encrypt = conf.options.encrypt || false;
      this.config.options.database = conf.options.database || "msdb";
      this.config.options.requestTimeout = conf.options.requestTimeout || 15000;
      this.config.options.useColumnNames = conf.options.useColumnNames || true;
      this.config.options.rowCollectionOnDone =
        conf.options.rowCollectionOnDone || true;
      this.config.options.trustServerCertificate =
        conf.options.trustServerCertificate || false;
      this.config.options.rowCollectionOnRequestCompletion =
        conf.options.rowCollectionOnRequestCompletion || true;
      this.config.options.debug = conf.options.debug || false;
    }

    if (this.config.authentication) {
      this.config.authentication.type = conf.authentication.type || "default";
    }

    if (TEDIOUS_MSSQL_DEBUG === "true") {
      console.log("Config: ", this.config);
    }

    /*
    this.config = {
      server: this.conf.server || "localhost",
      options: {
        encrypt: conf.options.encrypt || false,
        database: conf.options.database || "msdb",
        requestTimeout: conf.options.requestTimeout || 15000,
        useColumnNames: conf.options.useColumnNames || true,
        rowCollectionOnDone: conf.options.rowCollectionOnDone || true,
        trustServerCertificate: conf.options.trustServerCertificate || false,
        rowCollectionOnRequestCompletion:
          conf.options.rowCollectionOnRequestCompletion || true,
        debug: conf.options.debug || false,
      },
      authentication: {
        type: "default",
        options: {
          password: conf.authentication.options.password || "pwd_undefined",
          userName: conf.authentication.options.userName || "user_undefined",
        },
      },
    };
    */
  }
  execSql(query, array_parameters) {
    let params = [];

    if (array_parameters && Array.isArray(array_parameters)) {
      params = array_parameters.map((element, i) => {
        let MSSQLFielType = TYPES.Text;
        switch (element.type) {
          case "BigInt":
            MSSQLFielType = TYPES.BigInt;
            break;
          case "Time":
            MSSQLFielType = TYPES.Time;
            break;
          case "TinyInt":
            MSSQLFielType = TYPES.TinyInt;
            break;
          case "UDT":
            MSSQLFielType = TYPES.UDT;
            break;
          case "UniqueIdentifier":
            MSSQLFielType = TYPES.UniqueIdentifier;
            break;
          case "VarBinary":
            MSSQLFielType = TYPES.VarBinary;
            break;
          case "VarChar":
            MSSQLFielType = TYPES.VarChar;
            break;
          case "Xml":
            MSSQLFielType = TYPES.Xml;
          case "Date":
            MSSQLFielType = TYPES.Date;
            break;
          case "DateTime":
            MSSQLFielType = TYPES.DateTime;
            break;
          case "Decimal":
            MSSQLFielType = TYPES.Decimal;
            break;
          case "Float":
            MSSQLFielType = TYPES.Float;
            break;
          case "Money":
            MSSQLFielType = TYPES.Money;
            break;
          case "Numeric":
            MSSQLFielType = TYPES.Numeric;
            break;
          case "SmallDateTime":
            MSSQLFielType = TYPES.SmallDateTime;
            break;
          case "SmallInt":
            MSSQLFielType = TYPES.SmallInt;
            break;
          case "Int":
            MSSQLFielType = TYPES.Int;
            break;
          case "NVarChar":
            MSSQLFielType = TYPES.NVarChar;
            break;
          case "Char":
            MSSQLFielType = TYPES.Char;
            break;
          case "NChar":
            MSSQLFielType = TYPES.NChar;
            break;
        }

        return {
          name: element.name,
          type: MSSQLFielType,
          value: element.value,
        };
      });
    }

    return new Promise((resolve, reject) => {
      let connection = new Connection(this.config);
      connection.on("end", function () {
        if (TEDIOUS_MSSQL_DEBUG === "true") {
          console.log("Connection ended");
        }
      });
      connection.on("error", function (err) {
        if (TEDIOUS_MSSQL_DEBUG === "true") {
          console.trace("Connection error: ", err);
        }
      });

      if (TEDIOUS_MSSQL_DEBUG === "true") {
        connection.on("debug", function (text) {
          console.log(text);
        });
      }

      connection.on("connect", function (err) {
        if (err) {
          if (TEDIOUS_MSSQL_DEBUG === "true") {
            console.trace("Connection error: ", err);
          }

          connection.close();
          reject(err);
        } else {
          let request = new Request(query, function (rqerr, rowCount, rows) {
            if (rqerr) {
              if (TEDIOUS_MSSQL_DEBUG === "true") {
                console.trace("Connection error: ", rqerr);
              }
              reject(rqerr);
            } else {
              connection.close();
              if (rows && rows.length > 0) {
                let datas = rows.map((item) => {
                  let data = {};
                  Object.keys(item).forEach((k) => {
                    data[k] = item[k].value;
                  });

                  return data;
                });

                resolve({ rows: datas });
              } else {
                resolve({ rows: [] });
              }
            }
          });

          if (params && params.length > 0) {
            params.forEach((param) => {
              request.addParameter(param.name, param.type, param.value);
            });
          }
          if (TEDIOUS_MSSQL_DEBUG === "true") {
            console.log("Request Query: ", request);
          }
          connection.execSql(request);
        }
      });

      connection.connect();
    });
  }
};
