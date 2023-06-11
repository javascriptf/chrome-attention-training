const sqlite3 = require('sqlite3').verbose()

const DB_SOURCE  = "db.sqlite"

let db = new sqlite3.Database(DB_SOURCE, (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Connected to the chinook database.');
  });

const getAllUsers = function(db){
    let query = `SELECT * from user`
    return new Promise((resolve) => {
        db.all(query, [], (err, rows) => {
            if(err){
                throw err
            }
            resolve(rows.map((row)=>row.name))
        })
    })
}


// db.close((err) => {})


module.exports = {db,getAllUsers}