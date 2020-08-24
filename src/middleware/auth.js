const jwt = require('jsonwebtoken')
const User = require('../models/user')

//If we don't call next(), means that this middleware doens't allow to pass to the next stage
const auth = async (req, res, next) => {

    try {
        const token = req.header('Authorization').replace('Bearer ', '')  //We are grabbing the token provided in the header, and replacing the string 'Bearer ' for a '' because we want to grab only the token and not extra string
        const decoded = jwt.verify(token, process.env.JWT_SECRET)  //We are verifying if the token has a user associate. We need to provide the secret string that we used in the creation of the token as well. decoded will have as a propertie the id of the user
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token})  //We are looking for the user by id and if he has the token in his array of tokens

        //if we don't find any user, is because either the user doesn't exist or the token doesn't exist
        if (!user) {
            throw new Error()
        }

        req.token = token //We will store the token in the request, in order to use in the req object in the next stage
        req.user = user  //We will store the user in the request, in order to save time in the next step.
        next() //If all is ok, we are allowing to pass to the next stage

    } catch (e) {
        res.status(401).send({error: 'Please authenticate.'})
    }

}

module.exports = auth




