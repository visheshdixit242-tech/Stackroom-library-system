const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// DB Connect
const db = new sqlite3.Database('./database.db', (err) => {
  if(err) console.error(err);
  else console.log('✅ Connected to SQLite DB');
});

// Tables bana lo agar nahi hai
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS books (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, author TEXT, category TEXT, isbn TEXT, copies INTEGER, copiesAvailable INTEGER, content TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS members (id INTEGER PRIMARY KEY AUTOINCREMENT, mid TEXT, name TEXT, email TEXT, username TEXT, password TEXT, type TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS employees (id INTEGER PRIMARY KEY AUTOINCREMENT, empNo TEXT, name TEXT, email TEXT, category TEXT, address TEXT, salary INTEGER, joining TEXT, username TEXT, password TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS loans (id INTEGER PRIMARY KEY AUTOINCREMENT, bookId INTEGER, memberId INTEGER, issued TEXT, due TEXT, returned INTEGER DEFAULT 0, returnedOn TEXT)`);
});

// ===== API ROUTES =====

// BOOKS
app.get('/api/books', (req,res) => db.all("SELECT * FROM books", [], (err,rows)=>res.json(rows)));
app.post('/api/books', (req,res) => {
  const {title,author,category,isbn,copies,content} = req.body;
  db.run("INSERT INTO books (title,author,category,isbn,copies,copiesAvailable,content) VALUES (?,?,?,?,?,?,?)",
  [title,author,category,isbn,copies,copies,content], function(err){
    res.json({id:this.lastID});
  });
});

// MEMBERS
app.get('/api/members', (req,res) => db.all("SELECT * FROM members", [], (err,rows)=>res.json(rows)));
app.post('/api/members', (req,res) => {
  const {name,email,type} = req.body;
  const mid = 'M' + Date.now().toString().slice(-3);
  const username = 'student' + Date.now().toString().slice(-3);
  db.run("INSERT INTO members (mid,name,email,username,password,type) VALUES (?,?,?,?,?,?)",
  [mid,name,email,username,'1234',type], function(err){
    res.json({id:this.lastID});
  });
});

// EMPLOYEES
app.get('/api/employees', (req,res) => db.all("SELECT * FROM employees", [], (err,rows)=>res.json(rows)));
app.post('/api/employees', (req,res) => {
  const {empNo,name,email,category,address,salary,joining} = req.body;
  db.run("INSERT INTO employees (empNo,name,email,category,address,salary,joining,username,password) VALUES (?,?,?,?,?,?,?,?,?)",
  [empNo,name,email,category,address,salary,joining,empNo.toLowerCase(),'1234'], function(err){
    res.json({id:this.lastID});
  });
});
app.delete('/api/employees/:id', (req,res) => {
  db.run("DELETE FROM employees WHERE id=?", [req.params.id], ()=>res.json({ok:1}));
});

// LOANS
app.get('/api/loans', (req,res) => db.all("SELECT * FROM loans", [], (err,rows)=>res.json(rows)));
app.post('/api/loans', (req,res) => {
  const {bookId,memberId,issued,due} = req.body;
  db.run("INSERT INTO loans (bookId,memberId,issued,due) VALUES (?,?,?,?)", [bookId,memberId,issued,due]);
  db.run("UPDATE books SET copiesAvailable = copiesAvailable - 1 WHERE id=?", [bookId]);
  res.json({ok:1});
});
app.put('/api/loans/:id', (req,res) => {
  const {returned, returnedOn} = req.body;
  db.get("SELECT bookId FROM loans WHERE id=?", [req.params.id], (err,row)=>{
    db.run("UPDATE books SET copiesAvailable = copiesAvailable + 1 WHERE id=?", [row.bookId]);
  });
  db.run("UPDATE loans SET returned=?, returnedOn=? WHERE id=?", [returned,returnedOn,req.params.id]);
  res.json({ok:1});
});

app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));