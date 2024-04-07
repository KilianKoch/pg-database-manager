const { Client } = require("pg");

class DBConnection {
  Database;

  constructor() {
    this.Database = null; // Create a new PostgreSQL client with the provided configuration
  }

  /**
   * Retrieves data from the specified table based on the provided criteria.
   * @param {string} table - The name of the table to query.
   * @param {string} [where=""] - The WHERE clause of the query.
   * @param {Array} [values=[]] - The parameterized values for the query.
   * @param {string} [select="*"] - The columns to select in the query.
   * @param {boolean} [output=false] - Determines whether to modify the query result.
   * @returns {Promise} A promise that resolves with the query result.
   */
  async GetPG(table, where = "", values = [], select = "*", output = false) {
    const thisObject = this;
    return new Promise(function (resolve, reject) {
      if (typeof where != "string") {
        reject(
          "Error GetPG: Input is not a String, type: " + typeof where + "."
        );
      }
      let query;
      if (where == "") {
        query = {
          text: `SELECT ${select} FROM public.${table}`,
          values: values,
        };
      } else {
        query = {
          text: `SELECT ${select} FROM public.${table} WHERE ${where}`,
          values: values,
        };
      }

      thisObject.Database.query(query, (err, res) => {
        if (err) {
          reject(err);
        } else {
          if (output) {
            thisObject.Database.query(
              {
                text: `select * from information_schema.columns where table_name = '${table}'`,
                values: [],
              },
              (err, columns) => {
                if (err) {
                  reject(err);
                } else {
                  let Keys = {};
                  for (let i = 0; i < columns.rows.length; i++) {
                    Keys[columns.rows[i].column_name] =
                      columns.rows[i].data_type;
                  }
                  res.rows = res.rows.map(function (data) {
                    let newdata = {};
                    Object.assign(newdata, data);
                    for (let i = 0; i < columns.rows.length; i++) {
                      if (Keys[columns.rows[i].column_name] == "date") {
                        newdata[columns.rows[i].column_name] = DatetoHTML(
                          data[columns.rows[i].column_name]
                        );
                      } else {
                        newdata[columns.rows[i].column_name] =
                          data[columns.rows[i].column_name];
                      }
                    }
                    return newdata;
                  });
                  resolve(res);
                }
              }
            );
          } else if (!output) {
            res.rows.forEach((row) => {
              Object.keys(row).forEach((key) => {
                if (row[key] instanceof Date) {
                  const timezoneOffsetMinutes = row[key].getTimezoneOffset();
                  // Calculate the local time by adding the offset to the UTC time
                  row[key] = new Date(
                    row[key].getTime() - timezoneOffsetMinutes * 60 * 1000
                  );
                }
              });
            });
            resolve(res);
          }
        }
      });
    });
  }

  /**
   * Retrieves data by joining two tables based on the provided criteria and join information.
   * @param {string} table1 - The name of the first table to query.
   * @param {string} table2 - The name of the second table to join with the first.
   * @param {string} joinCondition - The condition on which to join table1 and table2.
   * @param {string} [where=""] - The WHERE clause of the query, applied after the join.
   * @param {Array} [values=[]] - The parameterized values for the query's WHERE clause.
   * @param {string} [select="*"] - The columns to select in the query, can include qualified names.
   * @param {boolean} [output=false] - Determines whether to modify the query result, applying data type conversions.
   * @returns {Promise} A promise that resolves with the query result, including any applied data type conversions.
   */
  async GetJoinedPG(
    table1,
    table2,
    joinCondition,
    where = "",
    values = [],
    select = "*",
    output = false
  ) {
    const joinQuery = `public.${table1} INNER JOIN public.${table2} ON ${joinCondition}
    }`;
    // Directly using GetPG to execute and handle the joined query
    return this.GetPG(joinQuery, where, values, select, output)
      .catch((err) => {
        throw err;
      });
  }

  /**
   * Sets data in the specified table based on the provided criteria.
   * @param {Array} array - An array of objects containing the data to set.
   * @param {Array|string} whereValues - The criteria to identify the rows to update.
   * @param {string} table - The name of the table to update.
   * @returns {Promise} A promise that resolves when the update is completed.
   */
  async SetPG(array, whereValues, table) {
    const thisObject = this;
    return new Promise(function (resolve, reject) {
      if (array.length == 0) {
        reject("No Data to Set.");
      }
      if (whereValues.length == 0) {
        reject("No whereValues.");
      }
      if (typeof whereValues == "string") {
        whereValues = [whereValues];
      }
      let DataTypes;
      thisObject.Database.query(
        {
          text: `select * from information_schema.columns where table_name = '${table}'`,
          values: [],
        },
        (err, columns) => {
          if (err) {
            reject(err);
          }
          DataTypes = {};
          for (let i = 0; i < columns.rows.length; i++) {
            DataTypes[columns.rows[i].column_name] = columns.rows[i].udt_name;
          }
          let sorted = [[array[0]]];
          for (let j = 0; j < whereValues.length; j++) {
            if (!Object.keys(array[0]).includes(whereValues[j])) {
              reject(`Element ${0} does not contain ${whereValues[j]}`);
            }
          }
          for (let i = 1; i < array.length; i++) {
            for (let j = 0; j < whereValues.length; j++) {
              if (!Object.keys(array[i]).includes(whereValues[j])) {
                reject(`Element ${i} does not contain ${whereValues[j]}`);
              }
            }
            for (let j = 0; j < sorted.length; j++) {
              if (objectsHaveSameKeys(sorted[j][0], array[i])) {
                sorted[j].push(array[i]);
                break;
              }
              if (j == sorted.length - 1) {
                sorted.push([array[i]]);
                break;
              }
            }
          }
          for (let i = 0; i < sorted.length; i++) {
            let str = `update public.${table} as t set `;
            let ToUpdate = ArrayRemove(
              Object.keys(sorted[i][0]),
              ...whereValues
            );
            7;
            let Keys = Object.keys(sorted[i][0]);
            for (let j = 0; j < ToUpdate.length; j++) {
              if (j != ToUpdate.length - 1) {
                str = str + ToUpdate[j] + " = c." + ToUpdate[j] + ", ";
              } else {
                str =
                  str + ToUpdate[j] + " = c." + ToUpdate[j] + " from (values ";
              }
            }
            let Values = [];
            for (let j = 0; j < sorted[i].length; j++) {
              for (let k = 0; k < Keys.length; k++) {
                Values.push(sorted[i][j][Keys[k]]);
              }
            }

            for (let j = 0; j < sorted[i].length; j++) {
              for (let k = 0; k < Keys.length; k++) {
                if (k == 0) {
                  str = str + `(`;
                }
                if (false && Values[j * Keys.length + k] === null) {
                  //Erstmal Ignorieren!
                  str = str + `$${j * Keys.length + k + 1}`;
                } else {
                  str =
                    str + `$${j * Keys.length + k + 1}::${DataTypes[Keys[k]]}`;
                }

                if (k == Keys.length - 1) {
                  str = str + `) `;
                } else {
                  str = str + `, `;
                }
              }
              if (j == sorted[i].length - 1) {
                str = str + `) `;
              } else {
                str = str + `, `;
              }
            }
            str = str + "as c(";
            for (let j = 0; j < Keys.length; j++) {
              if (j == Keys.length - 1) {
                str = str + Keys[j] + ") ";
              } else {
                str = str + Keys[j] + ", ";
              }
            }
            str = str + "where ";
            for (let j = 0; j < whereValues.length; j++) {
              str =
                str +
                "c." +
                whereValues[j] +
                "::" +
                DataTypes[whereValues[j]] +
                " = t." +
                whereValues[j];
              if (j != whereValues.length - 1) {
                str = str + " AND ";
              } else {
                str = str + ";";
              }
            }
            let query = {
              text: str,
              values: Values,
            };
            thisObject.Database.query(query, (err, res) => {
              if (err) {
                reject(err);
              }
            });
          }
          resolve("All set!");
        }
      );
    });
  }

  /**
   * Inserts data into the specified table.
   * @param {Array} array - An array of objects containing the data to insert.
   * @param {string} table - The name of the table to insert into.
   * @param {string} [toReturn=""] - The columns to return from the insertion.
   * @returns {Promise} A promise that resolves with the inserted data or a success message.
   */
  async InsertPG(array, table, toReturn = "") {
    const thisObject = this;
    return new Promise(function (resolve, reject) {
      if (array.length == 0) {
        reject("No Data to Insert.");
      }
      let DataTypes;
      thisObject.Database.query(
        {
          text: `select * from information_schema.columns where table_name = '${table}'`,
          values: [],
        },
        async (err, columns) => {
          let result = [];
          let tempRes;
          if (err) {
            reject(err);
          }
          DataTypes = {};
          //get alle Datatypes for PG
          for (let i = 0; i < columns.rows.length; i++) {
            DataTypes[columns.rows[i].column_name] = columns.rows[i].udt_name;
          }
          let sorted = [[array[0]]];
          //sorted by Class
          for (let i = 1; i < array.length; i++) {
            for (let j = 0; j < sorted.length; j++) {
              //Check if there exist same ObjectClass
              if (objectsHaveSameKeys(sorted[j][0], array[i])) {
                sorted[j].push(array[i]);
                break;
              }
              //if no create new one
              if (j == sorted.length - 1) {
                sorted.push([array[i]]);
                break;
              }
            }
          }
          for (let i = 0; i < sorted.length; i++) {
            let str = `insert into public.${table} (`;
            let Keys = Object.keys(sorted[i][0]);
            for (let j = 0; j < Keys.length; j++) {
              if (j == Keys.length - 1) {
                str = str + Keys[j] + ") Values ";
              } else {
                str = str + Keys[j] + ", ";
              }
            }
            for (let j = 0; j < sorted[i].length; j++) {
              for (let k = 0; k < Keys.length; k++) {
                if (k == 0) {
                  str = str + `(`;
                }
                if (DataTypes[Keys[k]] != "USER-DEFINED") {
                  str =
                    str + `$${j * Keys.length + k + 1}::${DataTypes[Keys[k]]}`;
                } else {
                  str = str + `$${j * Keys.length + k + 1}::${"text"}`;
                }

                if (k == Keys.length - 1) {
                  str = str + `) `;
                } else {
                  str = str + `, `;
                }
              }
              if (j == sorted[i].length - 1) {
                str = str + ``;
              } else {
                str = str + `, `;
              }
            }
            if (toReturn != "") {
              str = str + ` RETURNING ${toReturn}`;
            }
            let Values = [];
            for (let j = 0; j < sorted[i].length; j++) {
              for (let k = 0; k < Keys.length; k++) {
                Values.push(sorted[i][j][Keys[k]]);
              }
            }
            let query = {
              text: str,
              values: Values,
            };
            console.log(query);
            try {
              tempRes = await thisObject.Database.query(query);
              if (toReturn != "") {
                result = result.concat(tempRes.rows);
              }
            } catch (err) {
              reject(err);
            }
          }
          if (result.length == 0) {
            resolve("All inserted!");
          } else {
            resolve(result);
          }
        }
      );
    });
  }

  /**
   * Deletes data from the specified table based on the provided criteria.
   * @param {string} table - The name of the table to delete from.
   * @param {string} [where=""] - The WHERE clause of the delete statement.
   * @param {Array} [values=[]] - The parameterized values for the delete statement.
   * @param {boolean} [safety=true] - Stops the query to be executed if where="", thus if the query tries to delete a whole table.
   * @returns {Promise} A promise that resolves when the delete operation is completed.
   */
  async DeletePG(table, where = "", values = [], safety = true) {
    const thisObject = this;
    return new Promise(function (resolve, reject) {
      if (typeof where != "string") {
        reject(
          "Error DeletePG: Input is not a String, type: " + typeof where + "."
        );
      }
      let query;
      if (where == "" && safety) {
        reject(
          "Error DeletePG: you cannot delete your entire table with Saftey = true!"
        );
      } else if (where == "" && !safety) {
        query = {
          text: `DELETE FROM public.${table}`,
          values: values,
        };
      } else {
        query = {
          text: `DELETE FROM public.${table} WHERE ${where}`,
          values: values,
        };
      }

      thisObject.Database.query(query, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve("Deleted!");
        }
      });
    });
  }
  /**
   * Fetches schema information for a specified database table.
   *
   * @param {string} table - The name of the database table.
   * @returns {Promise} A Promise resolving to an array of column details along with ENUM values (if applicable).
   */
  async getSchemaPG(table) {
    let thisObject = this;
    return new Promise(function (resolve, reject) {
      thisObject.Database.query(
        {
          text: `select * from information_schema.columns where table_name = '${table}'`,
          values: [],
        },
        async function (err, columns) {
          if (err) {
            reject(err);
          } else {
            for (const column of columns.rows) {
              if (column.udt_schema !== "pg_catalog") {
                try {
                  const res = await new Promise((resolve, reject) => {
                    thisObject.Database.query(
                      {
                        text: `
                                            SELECT e.enumlabel
                                            FROM pg_type t
                                            JOIN pg_enum e ON t.oid = e.enumtypid
                                            JOIN pg_namespace n ON n.oid = t.typnamespace
                                            JOIN INFORMATION_SCHEMA.COLUMNS c ON c.table_name = $1 AND c.column_name = $2
                                            WHERE n.nspname = $3 AND t.typname = $4;
                                        `,
                        values: [
                          table,
                          column.column_name,
                          column.udt_schema,
                          column.udt_name,
                        ],
                      },
                      (error, res) => {
                        if (error) {
                          reject(error);
                        } else {
                          resolve(res.rows);
                        }
                      }
                    );
                  });

                  console.log(res); // Logging the fetched ENUM values
                  column.enums = res.map((item) => item.enumlabel);
                } catch (error) {
                  // Handle any errors that might occur during the query
                  console.error(error);
                }
              } else {
                column.enums = [];
              }
            }
            resolve(columns);
          }
        }
      );
    });
  }

  /**
   * Disconnects from the PostgreSQL database.
   * @returns {Promise} A promise that resolves when the disconnection is completed.
   */
  async DisconnectPG() {
    const thisObject = this;
    return new Promise(function (resolve, reject) {
      if (!thisObject.Database) {
        resolve("Verbindung war schon getrennt.");
      }
      try {
        thisObject.Database.end();
        thisObject.Database = null;
        resolve("Verbindung gentrennt.");
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Establishes a connection to the PostgreSQL database.
   * @param {Object} login - The login configuration for the database connection.
   * @returns {Promise} A promise that resolves when the connection is established.
   */
  async ConnectPG(login) {
    const thisObject = this;
    return new Promise(function (resolve, reject) {
      try {
        thisObject.Database = new Client(login);
      } catch (e) {
        reject(e);
      }
      thisObject.Database.connect(function (err) {
        if (err) reject(err);
        else {
          console.log("Connected!");
          this.connected = true;
          resolve("Connected!");
        }
      });
    });
  }
}

function ArrayRemove(array, ...Elements) {
  Elements.forEach((element) => {
    let index = array.indexOf(element);
    if (index > -1) {
      array.splice(index, 1);
    }
  });
  return array;
}

module.exports = DBConnection;
