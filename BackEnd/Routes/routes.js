const express = require('express');
const router = express.Router();
const User = require('../Database/Models/user');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dbcfg = require('../Config/dbconfig.js');
const Holiday = require('../Database/Models/holiday');
const Event = require('../Database/Models/event');

//Registration
router.post('/Register', (req, res, next) => {
    User.getUserByUserName(req.body.UserName, (err, user) => {
        if(err){
            res.json({success: false, exists: false, msg: "Failed to register user"});
        } else {
            if(user != null) {
                res.json({success: false, exists: true, msg: "UserName already in use"});
            } else {

                let newUser = new User({
                    UserName: req.body.UserName,
                    Email: req.body.Email,
                    Password: req.body.Password,
                    Salt: ""
                });
            
                User.addUser(newUser, (err, user) => {
                    if(err) {
                        res.json({success: false, exists: false, msg: "Failed to register user"})
                    } else {
                        res.json({success: true, exists: false, msg: "User registered"})
                    }
                });
            }
        }
    });
});

//Login
router.post('/Login', (req, res, next) => {
    User.getUserByUserName(req.body.UserName, (err, user) => {
        if(err){
            throw err;
        } else {
            if(user != null) {
                bcrypt.compare(req.body.Password, user.Password, (err, isMatch) => {
                    if(err) throw err;
                    if(isMatch){
                        let token = jwt.sign(user.toJSON(), dbcfg.secret, {
                            expiresIn: 604800 // 1 week
                        });
              
                        res.json({
                        success: true,
                        token: 'JWT '+ token,
                        user: {
                            id: user._id,
                            username: user.username,
                            email: user.Email
                            }
                        });
                    } else {
                        res.json({success: false, msg: "Password is incorrect"});
                    }
                });
            } else {
                res.json({success: false, msg: "UserName is incorrect"});
            }
        }
    })
});

router.get('/Home', passport.authenticate('jwt', {session: false}), (req, res, next) => {
    Holiday.getCurrentHoliday((err, holiday) => {
        if(err){
            console.log(err);
            Event.getEvents(req.user.UserName, (err, events) => {
                if(err) {
                    console.log(err);
                    res.json({user: req.user}); 
                } else {
                    res.json({user: req.user, events: events}); 
                }
            });
        }
        else {
            Event.getEvents(req.user.UserName, (err, events) => {
                if(err) {
                    console.log(err);
                    res.json({user: req.user, holiday: holiday}); 
                } else {
                    res.json({user: req.user, holiday: holiday, events: events}); 
                }
            }); 
        }
    });
});

module.exports = router;