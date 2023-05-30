const sqlite3 = require('sqlite3').verbose()
const md5 = require('md5')

const DB_SOURCE = "db.sqlite"

let db = new sqlite3.Database(DB_SOURCE, (err) => {
    if (err) {
        // Cannot open database
        console.error(err.message)
        throw err
    }else{
        console.log("Connected to the SQLite databse")
        db.run(`CREATE TABLE user (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name text,
            email text UNIQUE,
            password text,
            CONSTRAINT email_unique UNIQUE (email)
        )`,
        (err) => {
            if(err) {
                //Table already created
            }else{
                // Tabled is created
                var insert = 'INSERT INTO user (name, email, password) VALUES (?,?,?)'
                db.run(insert,["admin","admin@test.com", md5("admin12345")])
                db.run(insert, ["tester", "tester@test.com", md5("test123")])

            }
        })
    }
})

module.exports = db