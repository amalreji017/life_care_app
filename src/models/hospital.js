const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const geocode = require('../utils/geocode')
// const Tasks = require('./task')

const hospitalSchema = new mongoose.Schema({
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
    tokens : [{
        token:{
            type:String,
            required:true,
        }
    }]
},{
    timestamps:true
}) 
hospitalSchema.methods.toJSON = function(){
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    // delete userObject.latitude
    // delete userObject.longitude

    return userObject
}

hospitalSchema.methods.generateAuthToken = async function(){
    const user = this
    const token = jwt.sign({_id : user._id.toString()},process.env.JWT_SECRET_KEY)
    user.tokens=  user.tokens.concat({token}) 
    await user.save()
    return token
}

hospitalSchema.statics.findByCredentials = async (email,password) =>{
    const user = await Hospital.findOne({email})
    if(!user){
        throw new Error('Unable to login!!')
    }

    const isMatch = await bcrypt.compare(password,user.password)
    if(!isMatch){
        throw new Error('Unable to login!!')
    }
    return user
}

hospitalSchema.pre('save',async function(next){
    const user =  this
    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password,8)
    }  
    next()
})
const Hospital = mongoose.model('Hospital',hospitalSchema)

module.exports = Hospital