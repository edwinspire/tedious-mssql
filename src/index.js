var Connection = require("tedious").Connection;
var Request = require("tedious").Request;
const { TYPES } = require("tedious");

module.exports = class TediousMssql {
  constructor(conf) {
    conf.options = conf.options || {};

    this.config = {
      server: conf.server || "localhost",
      options: {
        encrypt: conf.options.encrypt || false,
        database: conf.options.database || "msdb",
        requestTimeout: conf.options.requestTimeout || 15000,
        useColumnNames: conf.options.useColumnNames || true,
        rowCollectionOnDone: conf.options.rowCollectionOnDone || true,
        trustServerCertificate: conf.options.trustServerCertificate || false,
        rowCollectionOnRequestCompletion:
          conf.options.rowCollectionOnRequestCompletion || true,
        debug: { token: false },
      },
      authentication: {
        type: "default",
        options: {
          password: conf.authentication.options.password || "pwd_undefined",
          userName: conf.authentication.options.userName || "user_undefined",
        },
      },
    };
  }
  execSql(query, array_parameters) {
    let params = [];

    if (array_parameters && Array.isArray(array_parameters)) {
      let params = array_parameters.map((element, i) => {
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
        //console.log("mssql tedious finalizado");
      });
      connection.on("error", function (err) {
        //console.trace(err);
      });
      connection.on("connect", function (err) {
        if (err) {
          //console.trace(err);
          connection.close();
          reject(err);
        } else {
          let request = new Request(query, function (err, rowCount, rows) {
            if (err) {
              //console.trace(err);
              reject(err);
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

          /*
                    let result = "";
                    request.on('row', function(columns) {  
                      console.log('row', columns);
                      columns.forEach(function(column) {  
                        if (column.value === null) {  
                          console.log('NULL');  
                        } else {  
                          result+= column.value + " ";  
                        }  
                      });  
                      console.log(result);  
                      result ="";  
                  }); 
          */
          /*
                    request.on("done", function (rowCount, more, rows) {
                      console.log('done', rowCount + " rows returned", more, rows);
                      //connection.close();
                      resolve(rows);
                    });
          
                    request.on("doneInProc", function (rowCount, more, rows) {
                      console.log('doneInProc', rowCount + " rows returned", more, rows);
                      //connection.close();
                      resolve(rows);
                    });
          
                    request.on("doneProc", function (rowCount, more, returnStatus, rows) {
                      console.log('doneProc', rowCount + " rows returned", more, rows);
                      //connection.close();
                      resolve(rows);
                    });
          */

          if (params && params.length > 0) {
            params.forEach((param) => {
              request.addParameter(param.name, param.type, param.value);
            });
          }

          connection.execSql(request);
        }
      });

      connection.connect();
    });
  }
};
