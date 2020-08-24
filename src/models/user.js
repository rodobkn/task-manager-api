const mongoose = require('mongoose')
const validator = require('validator')  //This is a thrid library package to do more complex validation stuff
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken') //This is the thrid packagate which allow us to set up json web tokens to the users
const Task = require('./task')

//We create a Schema before to create the model of the user itself, in order to have the possibility to use middleware
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,  //Here we are saying that is require to provide a name
        trim: true       //We cut the spaces at the beggining or/and the final of the string
    },
    password: {
        type: String,
        required: true,
        minlength: 7,    //The min length of the password needs to be 7
        trim: true,
        validate(value) {
            if(value.toLowerCase().includes('password')) {
                throw new Error("Your password musn't contain the word password")
            }
        }
    },
    email: {
        type: String,
        unique: true,    //Means that we can have only one email in the database with the same name
        required: true,
        trim: true,
        lowercase: true,    //Here we are transforming all the email in lowercase.
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    age: {
        type: Number,
        default: 0,          //We can set up a default number if the user doesn't provide anything. So in this case we will set up 0 years old in case that the user doesn't provide any information
        validate(value) {      //Here we are validating the age is a non negative number
            if (value < 0) {
                throw new Error('Age must be a positive number')
            }
        }
    },
    tokens: [{     //This will be an array of objects. Where each object contains the "token" property
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {         //We are going to store the image of the user as binary(buffer) data in the database
        type: Buffer
    }
}, {
    timestamps: true     //Here we are poviding 2 new fields in the database, when the user was created, and when was the last update of the user
})

//We are setting up the relation between user and task. THIS IS NOT STORED IN THE DATABASE. 'tasks' will be the propertie that we need to use after with populate()
userSchema.virtual('tasks', {
    ref: 'Task',         //We are doing reference to the Task model
    localField: '_id',   //Here we are saying that the thing stored in "owner" in the Task model, is the '_id' stored here
    foreignField: 'owner' //Here we are saying that the field '_id' of the User model is stored in the field 'owner' of the task model
})

//We are creating a new method to use over a SPECIFIC user.
userSchema.methods.generateAuthToken = async function () {
    const user = this

    //We are creating the token, where we need to provide something unique of the user, and for this reason we used "_id". The next parameter is a secret string, which is use after to verify if matches it.
    const token = jwt.sign({_id: user._id.toString() }, process.env.JWT_SECRET)
    
    user.tokens = user.tokens.concat({ token }) //We are adding a new object, which contains the new token, to the array of tokens of the current user
    await user.save()  //We add the changes of the specific user to the database.

    return token
}

//This is a method for a SPECIFIC user (user, not User). Is triggered when we send the user as JSON. So here we are modifying what we want to send
userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()  //We are copying the user, in another variable as an object

    //We delete the data that we don't want to send
    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar //We don't want to send the avatar buffer because is so large, so we can have a better performance. Obviously this is when we send the user for general purposes, there are specific routes where we send the avatar buffer

    //We return the modified object
    return userObject

}


//Here we are creating an special way to find a User. "statics" is because we can use this method in a general way, and not over a specific user
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })  //We are looking for a user with the provided email

    //If we didn't find any user
    if (!user) {
        throw new Error('Unable to login')
    }

    //Now we need to compare if the password provided is the same that the current password. For this we need bcrypt because we need to compare the hashvalues
    const isMatch = await bcrypt.compare(password, user.password)

    //In case that the password provided is not the same
    if (!isMatch) {
        throw new Error('Unable to login')
    }

    return user  //if everything was fine, we return the user
}


//We are running the middleware, just before save().
userSchema.pre('save', async function (next) {
    const user = this //We are grabbing the current user that is going to be saved

    //We see if we are going to modify the propertie "password" of the user
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)  //We update o create the hashed password for the user. The number 8 represents the times of we are going to run the hash algorithm
    }

    next()  //We need to put that, because the program know that is ready to go to the next step, that is saving the user

})

//We are using middleware here, inmediately before of the user.remove() call. Basically this function has the mission to delete all the task of the user that deleted his account
userSchema.pre('remove', async function (next) {

    const user = this
    await Task.deleteMany({ owner: user._id })  //We are deleting all the task where the owner is the current user id
    next()

})

//We are creating the model of user.
const User = mongoose.model('User', userSchema)

module.exports = User  //It is important to export your model
