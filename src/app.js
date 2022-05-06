const express = require('express')
const userRouter = require('./routers/user')
const hospitalRouter = require('./routers/hospital')
const cors = require('cors')
require('./db/mongoose')

const app = express()
//use
app.use(express.json())
app.use(cors())
app.use(userRouter)
app.use(hospitalRouter)

module.exports = app