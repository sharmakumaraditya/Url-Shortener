const express = require("express")
const users = express.Router()
const cors = require("cors")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const _ = require("lodash")
require('dotenv').config()
const nodemailer = require('nodemailer');
var api_key = 'b1df829f898334ff43ff5d5812a9e15a-ffefc4e4-b1b88ab7'
const mailgun = require("mailgun-js")
const DOMAIN = 'sandbox5dca1e6a485b4b6f9a8282de540bd818.mailgun.org'
const mg = mailgun({apiKey: api_key, domain: DOMAIN})

const { result } = require("lodash")
const User = require("../models/User")
users.use(cors())

process.env.SECRET_KEY = 'secret'
process.env.CLIENT_URL = 'accountactivatekey123'
process.env.CLIENT_URL = 'http://localhost:3000'


users.post('/register', (req, res) => {
    const today = new Date()
    const payload = {
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        email: req.body.email,
        password: req.body.password,
        created: today
    }

    User.findOne({
        email: req.body.email
    })
    .then(user => {
        if(!user)
        {
            bcrypt.hash(req.body.password, 10, (err, hash) => {
                payload.password = hash
            })
            const token = jwt.sign(payload, process.env.SECRET_KEY, {
                expiresIn: 1440
              });

            let mailTransporter = nodemailer.createTransport({ 
                service: 'gmail', 
                auth: { 
                    user: 'compscncec@gmail.com', 
                    pass: '4321csec4321'
                } 
            });
            const data = {
              from : 'csecgroup2017@gmail.com',
              to : payload.email,
              subject : 'PASSWORD RESET LINK',
              html : `
                  <h3> Click here to Activate Your Account</h3>
                  <link><p>${process.env.CLIENT_URL}/users/authenticate/${token}</p></link>
              `
            };
            mailTransporter.sendMail(data, function(error, data) { 
                if(error){
                    return res.json({
                      error : error.message
                    })
                  }
                  return res.status(400).json({error : "Authentication mail has been sent successfully!"})
                })
        }
        else{
            res.json({error: 'User already exists'})
        }
    })
    .catch(err => {
        res.send('error: ' + err)
    })
})


users.post('/authenticate',(req,res)=>{

    if(req.body.token){
          jwt.verify(req.body.token,process.env.SECRET_KEY,function(error,decodedData)
          {
            if(error){
              return res.status(401).json({
                error : "Incorrect or Expired Link"
              })
            }
            const {first_name, last_name, email, password, created}=decodedData;
            const temp_email = email
            User.findOne({
               email : temp_email
              })
              .then(user => 
                {
                if(!user)
                {
                    const userData = {
                        first_name: first_name,
                        last_name: last_name,
                        email: email,
                        password: password,
                        created: created
                    }
                    bcrypt.hash(password, 10, (err, hash) => {
                        userData.password = hash
                        User.create(userData)
                       .then(user => {
                            res.json({status: user.email + ' registered!'})
                        })
                        .catch(err => {
                            res.send('error: ' + err)
                        })
                    })
    
                }
                else {
            
                    res.status(400).json({error : "User Already Exist"})
                  }
                })
                .catch(err => {
                    res.send('error: ' + err)
                  })
            })
    
        }
        else{
            return res.status(401).json({error : "Authentication Error"})
        }
      
    })




users.post('/login', (req, res) => {
    User.findOne({
      email: req.body.email
    })
      .then(user => {
        if (user) {
          if (bcrypt.compareSync(req.body.password, user.password)) {
            // Passwords match
            const payload = {
              _id: user._id,
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email
            }
            let token = jwt.sign(payload, process.env.SECRET_KEY, {
              expiresIn: 1440
            })
            res.send(token)
          } else {
            // Passwords don't match
            res.json({ error: 'Password does not Match' })
          }
        } 
        else {
        
          res.json({ error: 'User does not exist' })
        }
      })
      .catch(err => {
        res.send('error: ' + err)
      })
  })

  users.get('/profile', (req, res) => {
    var decoded = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY)
  
    User.findOne({
      _id: decoded._id
    })
      .then(user => {
        if (user) {
          res.json(user)
        } else {
          res.send('User does not exist')
        }
      })
      .catch(err => {
        res.send('error: ' + err)
      })
  })




  users.put('/forgot-password',(req,res)=>{
    User.findOne({
        email: req.body.email
      })
        .then(user => {
            if(user)
            {
                const payload = {
              _id: user._id,
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email
            }
                
                const token = jwt.sign(payload, process.env.SECRET_KEY, {
                    expiresIn: 3000
                  });

                let mailTransporter = nodemailer.createTransport({ 
                    service: 'gmail', 
                    auth: { 
                        user: 'compscncec@gmail.com', 
                        pass: '4321csec4321'
                    } 
                });
                const data = {
                  from : 'csecgroup2017@gmail.com',
                  to : payload.email,
                  subject : 'PASSWORD RESET LINK',
                  html : `
                      <h3> Click here to reset the password!</h3>
                      <p><link>${process.env.CLIENT_URL}/users/resetpassword/${token}</p></link>
                  `
                };
                return user.updateOne({resetLink: token}, function(err,success) {
                  if(err){
                    return res.status(400).json({error : "Error in the link"})
                  }
                  else{
                    mailTransporter.sendMail(data, function(error, data) { 
                    if(error){
                        return res.json({
                          error : error.message
                        })
                      }
                      return res.status(400).json({error : "Email sent!"})
                    })
                  }
          
                })
            }
            else {
        
                res.json({ error: 'User does not exist' })
              }
            })
            .catch(err => {
              res.send('error: ' + err)
            })
        })
            



users.put('/resetpassword',(req,res)=>{

if(req.body.resetLink){
      jwt.verify(req.body.resetLink,process.env.SECRET_KEY,function(error,decodedData)
      {
        if(error){
          return res.status(401).json({
            error : "Token expired"
          })
        }
        User.findOne({
            resetLink: req.body.resetLink
          })
          .then(user => 
            {
            if(user)
            {

                  var temp_password
                  bcrypt.hash(req.body.newPass, 10, (err, hash) => {
                    const obj = {
                        password : hash,
                        resetLink : ''
                      }
            
                      user = _.extend(user,obj)
                      user.save((err,result) =>{
                        if(err){
                          return res.status(400).json({error : "Password error"})
                        }
                        else{
                          
                            return res.status(200).json({message : "password changed"})                    
                        }          
                      })
                  })

            }
            else {
        
                res.status(400).json({error : "User with this token not exist"})
              }
            })
            .catch(err => {
                res.send('error: ' + err)
              })
        })

    }
    else{
        return res.status(401).json({error : "Authentication Error"})
    }
  
})




// users.post('/register', (req, res) => {
//     const today = new Date()
//     const userData = {
//         first_name: req.body.first_name,
//         last_name: req.body.last_name,
//         email: req.body.email,
//         password: req.body.password,
//         created: today
//     }

//     User.findOne({
//         email: req.body.email
//     })
//     .then(user => {
//         if(!user)
//         {
//             bcrypt.hash(req.body.password, 10, (err, hash) => {
//                 userData.password = hash
//                 User.create(userData)
//                 .then(user => {
//                     res.json({status: user.email + 'registered!'})
//                 })
//                 .catch(err => {
//                     res.send('error: ' + err)
//                 })
//             })
//         }
//         else{
//             res.json({error: 'User already exists'})
//         }
//     })
//     .catch(err => {
//         res.send('error: ' + err)
//     })
// })



// users.put('/forgot-password',(req,res)=>{
//     User.findOne({
//         email: req.body.email
//       })
//         .then(user => {
//             if(user)
//             {
//                 const payload = {
//               _id: user._id,
//               first_name: user.first_name,
//               last_name: user.last_name,
//               email: user.email
//             }
                
//                 const token = jwt.sign(payload, process.env.SECRET_KEY, {
//                     expiresIn: 1440
//                   });
//                 const data = {
//                   from : 'csecgroup2017@gmail.com',
//                   to : payload.email,
//                   subject : 'PASSWORD RESET LINK',
//                   html : `
//                       <h3> Click here to reset the password!</h3>
//                       <p>${process.env.CLIENT_URL}/resetpassword/${token}</p>
//                   `
//                 };
//                 return user.updateOne({resetLink: token}, function(err,success) {
//                   if(err){
//                     return res.status(400).json({error : "Error in the link"})
//                   }
//                   else{
//                     mg.messages().send(data, function(error,body){
//                       if(error){
//                         return res.json({
//                           error : error.message
//                         })
//                       }
//                       return res.status(400).json({error : "Email sent!"})
//                     })
//                   }
          
//                 })
//             }
//             else {
        
//                 res.json({ error: 'User does not exist' })
//               }
//             })
//             .catch(err => {
//               res.send('error: ' + err)
//             })
//         })



module.exports = users