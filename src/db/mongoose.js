const mongoose = require('mongoose')

//We are connecting to our database. If you see carefully, you see ".../task-manager-api", that means the name of the database that we will use
mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,   //That means the index will create automatically
    useFindAndModify: false, //We provided that, in order to don't have the advertisement
})


// const task_1 = new Task({
//     description: '    Eat lunch'
// })

// task_1.save().then(() => {
//     console.log(task_1)
// }).catch((error) => {
//     console.log(error)
// })

// //We are creating an instance of our object "User" with his associate data
// const me = new User({
//     name: '    Mike   ',
//     email: 'MYEMAIL@MEAD.IO     ',
//     password: 'phone098!'
// })

// //Here we are storing the instance in the database. You can use promises after the saving
// me.save().then(() => {
//     console.log(me)
// }).catch((error) => {
//     console.log(error)
// })


