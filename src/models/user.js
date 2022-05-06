const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const geocode = require('../utils/geocode')
// const Tasks = require('./task')

const userSchema = new mongoose.Schema({
    name:{
        type : String,
        trim:true,
        required : true
    },
    email:{
        type:String,
        unique:true,
        required:true,
        trim:true,
        lowercase:true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Email invalid!!')
            }
        }
    },
    password:{
        type:String,
        required:true,
        minlength:6,
        trim:true,
        validate(value){
            if(value.toLowerCase().includes("password")){
                throw new Error('Password cannot contain "password"')
            }
        }
    },
    bloodGroup:{
        type:String,
        required:true,
        trim:true
    },
    location:{
        type:String,
        trim:true,
        required:true
    },
    latitude:{
        type:Number
        // required:true
    },
    longitude:{
        type:Number
        // required:true
    },
    age : {
        type : Number
    },
    tokens : [{
        token:{
            type:String,
            required:true,
        }
    }]
},{
    timestamps:true
})

userSchema.methods.toJSON = function(){
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar
    delete userObject.location
    delete userObject.latitude
    delete userObject.longitude
    delete userObject.bloodGroup

    return userObject
}

userSchema.methods.generateAuthToken = async function(){
    const user = this
    const token = jwt.sign({_id : user._id.toString()},process.env.JWT_SECRET_KEY)
    user.tokens=  user.tokens.concat({token}) 
    await user.save()
    return token
}

userSchema.statics.findByCredentials = async (email,password) =>{
    const user = await User.findOne({email})
    if(!user){
        throw new Error('Unable to login!!')
    }

    const isMatch = await bcrypt.compare(password,user.password)
    if(!isMatch){
        throw new Error('Unable to login!!')
    }
    return user
}

userSchema.pre('save',async function(next){
    const user =  this
    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password,8)
    }  
    next()
})

userSchema.pre('remove',async function(next){
    const user = this
    await Tasks.deleteMany({owner:user._id})
    next()
})
const User = mongoose.model('User',userSchema)

module.exports = User



// const user1 = new User({
//     name:'Plus-1',
//     email:'plus1@gmail.com',
//     password:'Pas!!sword1',
//     age:23
// })

// const User = mongoose.model('User',{
//     name:{
//         type : String
//     },
//     age : {
//         type : Number
//     }
// })