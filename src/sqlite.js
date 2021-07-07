/**
 * Module handles database management
 *
 * Server API calls the methods in here to query and update the SQLite database
 */

// Utilities we need
const fs = require("fs");

// Initialize the database
const dbFile = "./.data/perros.db";
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const dbWrapper = require("sqlite");
let db;

/* 
We're using the sqlite wrapper so that we can make async / await connections
- https://www.npmjs.com/package/sqlite
*/
dbWrapper
  .open({
    filename: dbFile,
    driver: sqlite3.Database
  })
  .then(async dBase => {
    db = dBase;

    // We use try and catch blocks throughout to handle any database errors
    try {
      // The async / await syntax lets us write the db operations in a way that won't block the app
      if (!exists) {
        // Database doesn't exist yet - create Choices and Log tables
        await db.run(
          "CREATE TABLE Perros (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT, edad INTEGER, sexo INTEGER, img TEXT)"
        );

        // Log can start empty - we'll insert a new record whenever the user chooses a poll option
        await db.run(
          "CREATE TABLE Log (id INTEGER PRIMARY KEY AUTOINCREMENT, perroId INTEGER, time STRING)"
        );
      } else {
        // We have a database already - write Choices records to log for info
        console.log(await db.all("SELECT * from Perros"));

        //If you need to remove a table from the database use this syntax
        //db.run("DROP TABLE Logs"); //will fail if the table doesn't exist
      }
    } catch (dbError) {
      console.error(dbError);
    }
  });

// Our server script will call these methods to connect to the db
module.exports = {
  /**
   * Get the dogs in the database
   *
   * Return everything in the Perros table
   * Throw an error in case of db connection issues
   */
  getDogs: async () => {
    // We use a try catch block in case of db errors
    try {
      return await db.all("SELECT * from Perros");
    } catch (dbError) {
      // Database connection error
      console.error(dbError);
    }
  },

  /**
   * Process a new dog
   *
   * Receive the user dog form from server
   * Add a log entry
   * Add a new dog
   * Return the updated list of dogs
   */
  processDog: async (name, edad, sexo, img) => {
    // Insert new Log table entry indicating the user choice and timestamp
    try {
      await db.run(
        "INSERT INTO Perros (nombre, edad, sexo, img) VALUES (?, ?, ?, ?)",
        [name, edad, sexo, img]
      );

      var dogId = await db.run("SELECT id from Perros ORDER BY id DESC LIMIT 1");

      // Build the user data from the front-end and the current time into the sql query
      await db.run("INSERT INTO Log (perroId, time) VALUES (?, ?)", [
        dogId,
        new Date().toISOString()
      ]);
      // Return the dogs so far
      return await db.all("SELECT * from Perros");
    } catch (dbError) {
      console.error(dbError);
    }
  },

  /**
   * Get logs
   *
   * Return choice and time fields from all records in the Log table
   */
  getLogs: async () => {
    // Return most recent 20
    try {
      // Return the array of log entries to admin page
      return await db.all("SELECT * from Log ORDER BY time DESC LIMIT 20");
    } catch (dbError) {
      console.error(dbError);
    }
  },

  /**
   * Clear logs
   *
   * Destroy everything in Log table
   */
  clearHistory: async () => {
    try {
      // Delete the logs
      await db.run("DELETE from Log");

      // Return empty array
      return [];
    } catch (dbError) {
      console.error(dbError);
    }
  },
  
  /**
   * Undo last dog
   *
   * Destroy everything in Log table
   */
  deleteDog: async (id) => {
    try {
      // Delete the logs
      await db.run("DELETE FROM Perros WHERE id = ?;", id);

      // Return the dogs so far
      return await db.all("SELECT * from Perros");
    } catch (dbError) {
      console.error(dbError);
    }
  },
  
  /**
   * Undo last dog
   *
   * Destroy everything in Log table
   */
  undoLast: async () => {
    try {
      // Delete the logs
      await db.run("DELETE FROM Perros WHERE id = (SELECT MAX(id) FROM Perros);");

      // Return empty array
      return [];
    } catch (dbError) {
      console.error(dbError);
    }
  }
};
