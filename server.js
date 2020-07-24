
var express = require("express")
var cors = require("cors")
var bodyParser = require("body-parser")
var app = express()
require('dotenv').config()
var mongoose = require("mongoose")
var port = process.env.PORT || 3000

app.unsubscribe(bodyParser.json())
app.unsubscribe(cors())
app.use(
    bodyParser.urlencoded({
        extended: false
    })
)

const mongoURI = 'mongodb://localhost:27017/link_short_mongo'

mongoose
    .connect(mongoURI, {useNewUrlParser: true})
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log(err))

var Users = require('./routes/Users')
app.use('/users', Users)
app.listen(port, () => {
    console.log("Server is Running on Port:" + port)
})