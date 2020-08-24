const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = new express.Router()

router.post('/tasks', auth , async (req, res) => {

    const task = new Task({
        ...req.body,           //We are using the spread operator to copy all the fields that contains the body of the request in this new object
        owner: req.user._id    //We are adding to this new object the id of the owner user
    })

    try{
        await task.save()
        res.status(201).send(task) //201 means "created"
    }catch (e) {
        //We need to write the status of the HTTP before to use send(). 400 is for client error (for example bad request). 200 is when all it was ok.
        res.status(400).send(e)
    }

})

//We need to send the tasks of the current user (we can filter some tasks by completed propertie, etc)
//GET /tasks?completed=true
//GET /tasks?limit=10&skip=20   -> limit is the max amount of tasks that we want to receive. skip is when you want to skip the first 20 tasks in this case. For example the first page of tasks would be limit=10 and skip=0 , the second page of task would be limit=10 and skip=10, ...
//GET /tasks?sortBy=createdAt:desc OR /tasks?sortBy=completed:desc
router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}

    //If there is something like this -> '/tasks?completed=true'
    if (req.query.completed) {
        match.completed = req.query.completed === 'true'  //We need to set up a boolean, because we received the boolean as string.
    }

    //If exists sortBy in the query
    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')  //We are spliting the string in two where the line of split is in the character ':'
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1  //With the first example of above we will have -> sort = {createdAt: -1}. if we have 'asc' would have -> sort= {createdAt: 1}
    }

    try{
        //We are running the relationship between user and task
        await req.user.populate({
            path: 'tasks',        //is the name that we provided in the virtual set up in the User model. Besides will be the name of the propertie created for the user
            match,                 //We can search tasks with the propertie 'completed': true or 'completed': false
            options: {
                limit: parseInt(req.query.limit),  //We are setting up the limit of the tasks that i want to receive. Besides remember that if you want to grab something of the url, by defect would be a string, so you need to parse into a number in this case
                skip: parseInt(req.query.skip),    //We are setting up the skip option. skip allow us to skip the 10 first tasks or the 20 first tasks,
                sort                              //We are adding the option of sort the data that we want to receive either for 'createdAt' or 'completed'
            }
        }).execPopulate()  

        res.send(req.user.tasks) //We are sending the tasks belong to the current user
    }catch (e) {
        res.status(500).send()
    }
})

//We are looking for a task by id
router.get('/tasks/:id', auth, async (req, res) => {

    const _id = req.params.id

    try {
        //We are looking for a task with the id provided through the browser AND the task belongs to the user
        const task = await Task.findOne({_id, owner: req.user._id})

        if (!task) {
            return res.status(404).send()
        }
        res.send(task)

    } catch (e) {
        res.status(500).send()
    }

})


router.patch('/tasks/:id', auth, async (req, res) => {

    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update)) 

    if (!isValidOperation) {
        return res.status(400).send({error: 'Invalid updates!'})
    }

    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id})


        if (!task) {
            return res.status(404).send()
        }
                
        updates.forEach((update) => task[update] = req.body[update]) 
        await task.save()

        res.send(task)

    } catch (e) {
        res.status(400).send(e)
    }
})

//Delete a task by id that belong to the current user
router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id })

        if (!task) {
            return res.status(404).send()
        }
        res.send(task)

    } catch (e) {
        res.status(500).send()
    }
})


module.exports = router //It is to important to import the router.