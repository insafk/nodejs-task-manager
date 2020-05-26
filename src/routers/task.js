const Task = require('../models/Task');
const express = require('express');
const auth = require('../middleware/auth');

const taskRouter = new express.Router();

taskRouter.post('/tasks', auth, async (req, res) => {
    try {
        const newTask = new Task({...req.body, owner: req.user._id});
        const savedTask = await newTask.save();
        res.status(201).send(savedTask);
    } catch(e) {
        res.status(400).send(e);
    }
})

// GET /tasks?completed=true
// GET /tasks?limit=10&skip=3
// GET /tasks?sortBy=createdAt:desc
taskRouter.get('/tasks', auth, async (req, res) => {
    const match = {};
    const sort = {};

    if(req.query.completed) {
        const completed = req.query.completed === 'true';
        match.completed = completed;
    }

    if(req.query.sortBy){
        const [key, order] = req.query.sortBy.split(':');
        sort[key] = order === 'desc' ? -1 : 1;
    }

    try {
        const user = req.user;
        await user.populate({
            path: 'tasks',
            match,
            options: { 
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate();
        const tasks = user.tasks;
        res.send(tasks);
    } catch (e) {
        res.status(400).send(e);
    }
})

taskRouter.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;
    try {
        const task = await Task.findOne({_id, owner:req.user._id});
        if(!task) {
            res.status(404).send();
        }

        res.send(task);
    } catch {
        res.status(500).send();
    }
})

taskRouter.patch('/tasks/:id', auth, async (req, res) => {
    
    try {
        // const task = await Task.findById(req.params.id, req.body);
        const task = await Task.findOne({_id: req.params.id, owner:req.user._id});

        if(!task)
            return res.status(404).send();

        const updateKeys = Object.keys(req.body);
        const allowedUpdates = ['name', 'completed'];
        const isValidUpdate = updateKeys.every((key) => allowedUpdates.includes(key));
        
        if(!isValidUpdate)
            return res.status(400).send({error: "Invalid Update!"});
        updateKeys.forEach( key => task[key] = req.body[key]);
        const updatedTask = await task.save();
        
        res.status(200).send(updatedTask);

    } catch (e) {
        console.log(e);
        res.status(400).send(e);
    }
})

taskRouter.delete('/tasks/:id', auth, async(req, res) => {
    try{
        const task = await Task.findOneAndDelete({_id: req.params.id, owner:req.user._id});

        if(!task)
            return res.status(404).send();
        res.send(task);
    } catch (e) {
        res.status(400).send(e);
    }
})

module.exports = taskRouter;
