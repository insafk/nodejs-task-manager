const express = require('express');
const multer = require('multer');
const sharp = require('sharp');

const User = require('../models/User');
const auth = require('../middleware/auth');
const {sendCancellationMail, sendWelcomeMail}  = require('../emails/account');
const userRouter = new express.Router();

userRouter.post('/users', async (req, res) => {
    const newUser = new User (req.body);

    try {
        const user = await newUser.save();
        const token = await user.generateAuthToken();
        sendWelcomeMail(user.email, user.name);
        
        res.send({user, token});
    } catch (e) {
        res.status(400).send(e);
    }
})

/* Remove */
// userRouter.get('/users', async (req, res) => {
//     try {
//         const users = await User.find({});
//         res.send(users);
//     } catch (e) {
//         res.status(400).send(e);
//     }
// })

userRouter.get('/users/me', auth, (req, res) => {
    const user = req.user;
    res.send(user);
})

// userRouter.get('/users/:id', async (req, res) => {
//     const _id = req.params.id;
//     try {
//         const user = await User.findById(_id);
//         if(!user) {
//             res.status(404).send();
//         }

//         res.send(user);
//     } catch {
//         res.status(500).send();    
//     }
// })

userRouter.patch('/users/me', auth, async (req, res) => {
    const updateKeys = Object.keys(req.body);
    const allowedUpdates = ['name', 'age', 'password', 'email'];
    const isValidUpdate = updateKeys.every((key) => allowedUpdates.includes(key));

    if(!isValidUpdate)
        return res.status(400).send({error: "Invalid Update!"});

    try {
        const targetUser = req.user;
        updateKeys.forEach((key) => targetUser[key] = req.body[key]);
        const updatedUser = await targetUser.save();

        res.status(200).send(updatedUser);

    } catch (e) {
        res.status(400).send(e);
    }
})

userRouter.delete('/users/me', auth, async(req, res) => {
    try{
        const user = req.user;
        await user.remove();
        sendCancellationMail(user.email, user.name);
        res.send(user);
    } catch (e) {
        res.status(400).send(e);
    }
})

userRouter.post('/users/login', async(req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.send({user, token});
    } catch (e) {
        res.status(400).send(e.message);
    }
})

userRouter.post('/users/logout', auth, async(req, res) => {
    try {
        const token = req.token;
        const user = req.user;
        console.log(user.tokens);

        user.tokens = user.tokens.filter((tokenInArray) => tokenInArray.token !== token);
        console.log(user.tokens);
        await user.save();
        res.send();
    } catch (error) {
        console.log(error);
        res.status(500).send();
    }
})

userRouter.post('/users/logoutAll', auth, async(req, res) => {
    try {
        const user = req.user;
        user.tokens = [];
        await user.save();
        res.send();
    } catch (error) {
        console.log(error);
        res.status(500).send();
    }
})

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/))
           return cb(new Error("Supported files are jpg, jpeg and png"));
        cb(undefined, true);
    }
});

userRouter.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    try {
        const buffer = await sharp(req.file.buffer).resize({height: 250, width: 250}).png().toBuffer();
        req.user.avatar = buffer;
        await req.user.save();
        res.send();    
    } catch (error) {
        console.log(error);
        res.status(500).send();
    }
    
}, (error, req, res, next) => {
    res.status(400).send({error: error.message});
});

userRouter.delete('/users/me/avatar', auth, async (req, res) => {
    try {
        req.user.avatar = undefined;
        await req.user.save();
        res.send();
    } catch (error) {
        res.status(500).send();
    }
});

userRouter.get('/users/:id/avatar', async(req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if(!user || !user.avatar)
            throw new Error();
        
        res.set('Content-Type', 'image/png').send(user.avatar);
    } catch (error) {
        res.status(404).send();
    }
});

module.exports = userRouter;
