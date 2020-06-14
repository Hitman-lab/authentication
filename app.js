require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const app = express();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const session = require('express-session'); 
const passport = require('passport');
const pssLocalMongoose = require("passport-local-mongoose");

// const md5 = require('md5');
// const encrypt = require('mongoose-encryption');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use(session({
    secret: "session secret",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize()); // initialize passport 
app.use(passport.session()); // also use passport for session

// database connection
mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);
// DB Schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(pssLocalMongoose);

// use this plugin before the model gets created
// userSchema.plugin(encrypt, {secret: process.env.SECRETS, encryptedFields: ['password']}); 

// Data Model
const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/', function(req, res) {
    res.render('home');
});

app.get('/register', function(req, res) {
    res.render('register');
});

app.get('/login', function(req, res) {
    res.render('login');
});

app.get('/secrets', function(req, res) {
    if(req.isAuthenticated()){
        res.render('secrets');
    }else {
        res.redirect('/login');
    }
});

app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
})

// password : md5(req.body.password)
app.post('/register', function(req, res) {
    
    User.register( {username: req.body.username}, req.body.password, function(err, regUser) {
        if(err) {
            console.log(err);
            res.redirect('/register');
        }else {
            passport.authenticate("local")(req, res, function() {
                res.redirect('/secrets');
            });
        }
    })

});

 // const password = md5(req.body.password);
app.post('/login', function(req, res) {
    
    const user = new User({
        username : req.body.username,
        password: req.body.password
    });

    req.login(user, function(err) {
        if(err) {
            console.log(err);
        }else {
            passport.authenticate("local")(req, res, function() {
                res.redirect('/secrets');
            });
        }
    });
});

app.listen(8080, function() {
    console.log('server started on port 8080');
});