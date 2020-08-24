const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)  //We are setting our API key in this module provided for sendgrid through enviroment variables

//We are creating a function that send a welcome email
const sendWelcomeEmail = (email, name) => {

    //We are creating the email that we want to send to the user that joined us
    sgMail.send({
        to: email,
        from: 'rodobkn98@gmail.com',
        subject: 'Thanks for joining in!',
        text: `Welcome to the app, ${name}. Let me know how you get along with the app`   //If you can see, that is a new syntax to inject variables insides of a string
    })

}

//We are creating a function that send a bye bye email(when the user deletes his account)
const sendGodbyeEmail = (email, name) => {

    sgMail.send({
        to: email,
        from: 'rodobkn98@gmail.com',
        subject: 'We are sad because you left the comunity',
        text: `Why did ${name} leave the comunity? `
    })
}

//It is important to export your functions in order to use in the function in the correct folder
module.exports = {
    sendWelcomeEmail,
    sendGodbyeEmail
}


