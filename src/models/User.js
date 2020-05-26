const mongoose = require('mongoose');
const validator = require('validator')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./Task');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate(value){
            if(! validator.isEmail(value))
                throw new Error("Invalid mail id");
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password cannot contain "password"')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if(value < 0)
                throw new Error("Age must be positive");
        }
    },
    avatar: {
        type: Buffer
    },
    tokens : [{
        token: {
            type: String,
            required: true
        }
    }]
}, {
    timestamps: true
});

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email});
    const errorObj = new Error ("Login failed!");
    if(!user)
        throw errorObj;

    const isMatch = await bcrypt.compare(password, user.password);

    if(isMatch !== true)
       throw errorObj;

    return user;
}

userSchema.methods.generateAuthToken = async function() {
    const user = this;

    const token = jwt.sign({_id: user._id.toString()}, process.env.BCRYPT_SECRET);

    user.tokens = user.tokens.concat({token});
    await user.save();

    return token;
}

userSchema.methods.toJSON = function() {
    const user = this;
    const userObject = user.toObject();
    
    delete userObject.password;
    delete userObject.tokens;

    return userObject; 
}

userSchema.pre('save', async function(next) {
    const user = this;

    if(user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }

    next();
})

userSchema.pre('remove', async function(next) {
    const user = this;
    await Task.deleteMany({owner : user._id});
    next();
})

const User = mongoose.model("User", userSchema);

module.exports = User;
