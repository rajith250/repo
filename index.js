

const express = require('express');
const mysql   = require('mysql');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
require('dotenv').config(); 


const app = express();
const userController  = require("./controllers/userController");
const linkGeneratorController = require('./controllers/linkGeneratorController');
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('trust proxy', true);


app.use(session({
    secret: 'pass123',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }  
}));




const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});



const loginRateLimiter = rateLimit({ windowMs: 3 * 1000,  max: 1,  message: 'Too many login attempts, please try later.'});



app.use(function(req,res,next){
  req.db = db;  
  next();
});


app.get('/login', (req, res) => {
    res.render('login', { title: 'Home' , message :'', maindiv: ' hidden '});
    
});


app.post('/login', loginRateLimiter, (req, res) => {
    userController.login(req, res);
})


app.get('/home', (req, res) => {   
  //console.log(req.session.user.role);
  if (req.session.user && req.session.user.role =='USER') {
        res.render('home', { title: 'Home', user: req.session.user, token_no :req.session.user.token });
  } else if (req.session.user && req.session.user.role == 'ADMIN') {    
        res.render('home-admin', { title: 'Admin - Home', msg:'', user: req.session.user, token_no :req.session.user.token });

  } else {
    res.redirect('/login');
  }
});


app.post('/delete-user', (req, res) => {   
  //console.log(req.session.user.role);
  if (req.session.user && req.session.user.role =='ADMIN') {
       userController.deleteUser(req, res);
  } else {
    res.redirect('/login');
  }
});







app.get('/directlogin', (req, res) => {
    linkGeneratorController.directLogin(req, res);
});


app.post('/linkgenerate', (req, res) => {  
  linkGeneratorController.generateLink(req, res);
});

app.post('/get-time', (req, res) => {  
  userController.getTime(req, res);
});



app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.redirect('/home');
    }
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});


// Start the server
app.listen(port, () => {
    console.log(`App running on http://localhost:${port}`);
});
