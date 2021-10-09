var Connection = require("tedious").Connection;
var Request = require("tedious").Request;

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
    //console.log(this.config);
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

          if (array_parameters && array_parameters.length > 0) {
            array_parameters.forEach((param) => {
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
