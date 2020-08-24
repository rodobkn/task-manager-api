const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middleware/auth')
const { sendWelcomeEmail, sendGodbyeEmail } = require('../emails/account')
const router = new express.Router()



//It is important to write de "async" statement before the function. In order to use "await" after
router.post('/users', async (req, res) => {

    const user = new User(req.body)

    try {
        await user.save()  //user in the best case is stored in the db, in the worst case is not stored and runs the catch statement
        sendWelcomeEmail(user.email, user.name)  //Here we are sending a welcome email to the user that just created his account. This is an asynchronous process as wel, but we dont have to write 'await' because is not a esential process to go forward
        const token = await user.generateAuthToken() //We generate a token for the new user, in order to provide inmediately acces to the privileged routes
        res.status(201).send({user, token})  //201 is to comunicate trhough HTTP that was "created"
    } catch (e) {
        res.status(400).send(e)
    }

})

router.post('/users/login', async (req, res) => {
    try {
        //We are calling out method created in the Schema, in order to see if we can grab the user with his provided information
        const user = await User.findByCredentials(req.body.email, req.body.password)
        
        //We are creating the token for the SPECIFIC user. You need to see that we are using user and not User
        const token = await user.generateAuthToken()

        res.send({ user, token })
    } catch (e) {
        res.status(400).send() //400 means client error
    }
})

//Here is the route to logout. Obviously in order to logout, we need authentication
router.post('/users/logout', auth, async (req, res) => {

    try {
        //We saved in the auth middleware the user and the token in the request
        //We are updating the array of objects that have the current user
        req.user.tokens = req.user.tokens.filter((token) => {  //You need to remember that token is an object with the propertie token. This propertie contains the real value of the token
            return token.token !== req.token  //We will maintain only the tokens that are different of the current token. In order to maintain the token, we need to return True
        })
        await req.user.save() //We are saving the current user after filtering his array of objects
        res.send() //if all is ok, we return a 200 status(is the default by defect)

    } catch (e) {
        res.status(500).send()
    }

})

//we are closing all the accounts of the current user. (basically eliminating all the tokens)
router.post('/users/logoutAll', auth, async (req, res) => {

    try {
        req.user.tokens = []
        await req.user.save()
        res.send()

    } catch (e) {
        res.status(500).send()
    }

})


//Here we are looking for the profile of the user. After '/users/me' is the middleware parameter
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user) //Here we are sending the information of the current user that was stored in the request in the middleware
})

//THE COMMENT STATEMENT BELOW IS TO GRAB A SPECIFIC USER BY ID. IN THIS APP WE WON'T USE THIS ROUTE, BUT MAYBE IS USEFUL IN FUTURE CODES
// //This get is for grabbing a specific user. The id is coming through the browser, no with a json as post
// router.get('/users/:id', async (req, res) => {
//     //Here we are grabbing the id that was provided through the browser
//     const _id = req.params.id

//     try{
//         const user = await User.findById(_id)
//         if (!user) {
//             //404 represents "not found" and we are using return because we want to stop the process in case that we don't find anything
//             return res.status(404).send()
//         }
//         res.send(user)
//     } catch(e) {
//         res.status(500).send()
//     }

// })

//We are updating the current user
router.patch('/users/me', auth, async (req, res) => {

    const updates = Object.keys(req.body)  //We are storing in an array all the keys of the received object
    const allowedUpdates = ['name', 'email', 'password', 'age'] //These are the keys that are available to be update in the user model
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))  //We are iterating through the updates array to see if there is some key that isnt't allowed to update

    //In case of isValidOperation == false -> There is at least one key that isn't allowed to update in the updates array
    if (!isValidOperation) {
        return res.status(400).send({error: 'Invalid updates!'})
    }

    try {

        // const user = await User.findById(req.params.id)

        updates.forEach((update) => req.user[update] = req.body[update]) //user["name"] = user.name -> So we are updating the user with each propertie that we want to update
        await req.user.save()  //now, we are using this, because we want to run the middleware before save()
        res.send(req.user)

    } catch (e) {
        //If runvalidators said that the data provided is not valid, is because the client request was bad. For this reason the 400 error
        res.status(400).send(e)
    }

})

//This route is going to provide to delete the account of the current user
router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()  //We are removing the current user that was stored in the request
        sendGodbyeEmail(req.user.email, req.user.name)  //We are sending a godbye email. It is not necesary to write 'await' because is not esential to the next processes
        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})

//We are setting up multer, in order to upload file to our application
const upload = multer({
    //dest: 'avatars',   //This is the folder where the files will be stored  -> WE HAVE THIS LINE COMMENTED BECAUSE WE ARE GOING TO STORE THE IMAGE IN OUR DATABASE AS BUFFER DATA. SO IN ORDER TO DO THAT, WE DON'T HAVE TO PROVIDE A DESTINATION
    limits: {
        fileSize: 1000000  //This is the max size that a file can have. The units are in bytes. So one million bytes = 1mb.
    },
    fileFilter(req, file, cb) {                             //We are doing a validation of the file that is being uploaded. Basically here we specify what kind of files we want to receive(only pdf for instance)
        
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {                            //Here we are working with regular expresions in order to know if the file comply the requirements
            return cb(new Error('Please upload a image with format jpg or jpeg or png'))  //We need to cal cb() yes or yes. In this case we are saying that was an error
        }
        cb(undefined, true)  //Here we are calling cb(), but in a positive way, so we will store the image provided by the user
    }
})

//This is the post to upload files. It is important to write a nice name in single() because we will need this name as the key in Postman to upload files. THIS ROUTE WORKS AS UPDATE OPERATION AS WELL! NO ONLY CREATE OPERATION
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {  //It is important to take care of the order of the middleware functions. We want to authenticate the user first, and then check if the file is correct

    //We are providing the image that the user uploaded in a buffer format to sharp(). Then it transform into an image with the metrics showed down below(you can choose whatever you want), and we transform the image into a png format. So we are going to deal only with png images. After all this procces, we transform all the processed data into a buffer data again.
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250}).png().toBuffer()  

    req.user.avatar = buffer  //We are storing the image of the user in his propertie('avatar') in a buffer format

    await req.user.save()   //We are saving the file uploaded by the user in the db
    res.send()

}, (error, req, res, next) => {                   //This second function argument is only focus to manage errors. You need to provide the 4 arguments that I wrote in order to do working this function
    res.status(400).send({ error: error.message })  //Here, generally we are sending that the user upload an incorrect format of image or an image with a size grater than the size that I specified. Remember that we do that in order to send a clean json error instead of a html error
})

//We are deleting the image of the current user
router.delete('/users/me/avatar', auth, async (req, res) => {

    req.user.avatar = undefined  //We are stting up the propertie 'avatar' to undefined.
    await req.user.save()
    res.send()

})

//We are grabbing the image of a specific user
router.get('/users/:id/avatar', async (req, res) => {

    try {
        const user = await User.findById(req.params.id)  //We are grabbing the user by id

        if (!user || !user.avatar) {    //If we don't have anything in user, or if the user doesn't have an image, we will throw an error
            throw new Error()
        }

        res.set('Content-Type', 'image/png')  //We need to specify that we are returning an image in the png format. WE ARE SETTING HEADERS HERE, WHERE THE KEY IS 'Content-Type' and the value is 'image/png'
        res.send(user.avatar)  //we send the image

    } catch (e) {
        res.status(404).send()
    }

})


module.exports = router //It is to important to import the router.

