const express = require('express')
require('./db/mongoose')  //we don't want to grab anything from mongoose, but we want to run this file, because we want to connect to the database
const userRouter = require('./routers/user') //We are exporting the routers of the user resources
const taskRouter = require('./routers/task') 

const app = express()
const port = process.env.PORT


//We are saying that all JSON that we received, we will parsed in order to manipulate as a JS object
app.use(express.json())
//We are saying to express that use the userRouter
app.use(userRouter)
app.use(taskRouter)



app.listen(port, () => {
    console.log('Server is up on port ' + port)
})