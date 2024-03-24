# DBConnection Class Documentation

## Overview
The `DBConnection` class is designed to facilitate interactions with a PostgreSQL database, providing methods for connecting to the database, performing CRUD operations, and fetching schema information.

## Constructor

### DBConnection()
Initializes a new instance of the DBConnection class.

## Methods

### async ConnectPG(login)
- Establishes a connection to the PostgreSQL database.
- **Parameters:**
  - `login` (Object): Configuration for database connection.
- **Returns:** Promise that resolves upon establishing the connection.

### async GetPG(table, where = "", values = [], select = "*", output = false)
- Retrieves data from a specified table.
- **Parameters:**
  - `table` (String): Table name.
  - `where` (String, optional): WHERE clause.
  - `values` (Array, optional): Parameterized query values.
  - `select` (String, optional): Columns to select.
  - `output` (Boolean, optional): Modify query result.
- **Returns:** Promise with the query result.

### async SetPG(array, whereValues, table)
- Updates data in a specified table.
- **Parameters:**
  - `array` (Array): Data to update.
  - `whereValues` (Array|String): Update criteria.
  - `table` (String): Table name.
- **Returns:** Promise that resolves upon completion.

### async InsertPG(array, table, toReturn = "")
- Inserts data into a specified table.
- **Parameters:**
  - `array` (Array): Data to insert.
  - `table` (String): Table name.
  - `toReturn` (String, optional): Columns to return.
- **Returns:** Promise with inserted data or success message.

### async DeletePG(table, where = "", values = [], safety = true)
- Deletes data from a specified table.
- **Parameters:**
  - `table` (String): Table name.
  - `where` (String, optional): WHERE clause.
  - `values` (Array, optional): Parameterized query values.
  - `safety` (Boolean, optional): Execute safety check.
- **Returns:** Promise that resolves upon completion.

### async getSchemaPG(table)
- Fetches schema information for a specified table.
- **Parameters:**
  - `table` (String): Table name.
- **Returns:** Promise with schema details.

### async DisconnectPG()
- Disconnects from the PostgreSQL database.
- **Returns:** Promise that resolves upon disconnection.

## Example Usage

```javascript
const db = new DBConnection();

// Establish a connection to the database
const loginConfig = {
    user: 'your_username',
    password: 'your_password',
    host: 'localhost',
    port: 5432,
    database: 'your_database'
};
await db.ConnectPG(loginConfig);

// Retrieve data from a table
const userData = await db.GetPG('users', 'age > $1', [18], 'name, age');
console.log('Users above 18:', userData.rows);

// Insert data into a table
const newUser = { name: 'Alice', age: 25 };
await db.InsertPG([newUser], 'users');
console.log('New user inserted.');

// Update data in a table
const updateCriteria = ['name']; // Match users with name "Alice"
const updatedData = {name:"Alice", age: 26 };
await db.SetPG([updatedData], updateCriteria , 'users');
console.log('User data updated.');

// Delete data from a table
const deleteCriteria = ['Bob']; // Match users with name "Bob"
await db.DeletePG('users', 'name = $1', deleteCriteria);
console.log('User data deleted.');

// Fetch schema information for a table
const schemaInfo = await db.getSchemaPG('users');
console.log('Schema Information:', schemaInfo);

// Disconnect from the database
await db.DisconnectPG();
console.log('Disconnected from the database.');

```

This documentation provides a comprehensive guide to utilizing the `DBConnection` class for managing database interactions within a Node.js application.