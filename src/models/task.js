const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const taskSchema = new mongoose.Schema({
    description: {
        type: String,
        trim: true,
        required: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    owner: {                                   //We are setting up an owner(user) for the task. The id of the associate user will go to the database, as all the other values
        type: mongoose.Schema.Types.ObjectId,  //Here we are saying that we are going to store the id of the owner user
        required: true,
        ref: 'User'                            //We are doing references to the model User. So this id belongs to a user. With this in place, we can use the mongoose features for the relationship between tasks and users
    }
}, {
    timestamps: true
})

const Task = mongoose.model('Task', taskSchema)

module.exports = Task  //It is important to export your model
