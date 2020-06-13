require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const app = express();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;
// const md5 = require('md5');
// const encrypt = require('mongoose-encryption');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// database connection
mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true, useUnifiedTopology: true});
// DB Schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

// use this plugin before the model gets created
// userSchema.plugin(encrypt, {secret: process.env.SECRETS, encryptedFields: ['password']}); 

// Data Model
const User = mongoose.model('User', userSchema);

app.get('/', function(req, res) {
    res.render('home');
});

app.get('/register', function(req, res) {
    res.render('register');
});

app.get('/login', function(req, res) {
    res.render('login');
});

// password : md5(req.body.password)
app.post('/register', function(req, res) {
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        let user = new User({
            email:  req.body.username,
            password: hash
        });
        user.save(function(err) {
            if(!err) {
                res.render('secrets');
            }else{
                console.log('error while saving the data');
            }
        });
    });
});

 // const password = md5(req.body.password);
app.post('/login', function(req, res) {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email: username}, function(err, foundUser) {
        if(err) {
            console.log(err);
        }else {
            if(foundUser) {
                bcrypt.compare(password, foundUser.password, function(err,  result) {
                    if(result == true) {
                        res.render('secrets');
                    }
                });
            }else{
                console.log('Could not find any user please do register and try to login back again!');
            }
        }
    });
});

app.listen(8080, function() {
    console.log('server started on port 8080');
});