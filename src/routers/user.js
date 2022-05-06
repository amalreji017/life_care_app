const express = require('express')
const User = require('../models/user')
const Hospital = require('../models/hospital')
const auth = require('../middleware/auth')
const {sendwelcomeEmail , sendDeleteEmail,sendRequestBlood} = require('../emails/account')
const geocode = require('../utils/geocode')
const router = new express.Router()
const nearestFirst = require('../utils/nearest')

//signup for new user
router.post('/users/signup', async (req,res)=>{
   
    const user = new User(req.body)
    try{
        console.log(user)
        geocode(req.body.location,async(error,{latitude,longitude,loc}={})=>{
            if(error){
                return res.send({error})
            }
            user.latitude = latitude
            user.longitude = longitude
            sendwelcomeEmail(user.email,user.name)
            const token = await user.generateAuthToken() 
            res.status(201).send({user,token})
            await user.save()
        })
    }catch(e){
        res.status(400).send(e)
    }
})

//login to account
router.post('/users/login',async(req,res)=>{
    try{
        const user = await User.findByCredentials(req.body.email,req.body.password)
        const token = await user.generateAuthToken()
        res.send({user,token})
    }catch(e){
        res.status(400).send()
    }

})

//logout
router.post('/users/logout', auth ,async (req,res)=>{
    try{
        req.user.tokens = req.user.tokens.filter((userToken) => {
            return userToken.token !== req.token
        })
        await req.user.save()
        res.send()
    }catch(e){
        res.status(500).send()
    }
})

//logout from all devices/sessions 
router.post('/users/logoutAll', auth , async(req,res) =>{
    try{
        req.user.tokens = []
        await req.user.save()
        res.send()
    }catch(e){
        res.status(500).send()
    }

})

//get profile
router.get('/users/me',auth,async(req,res)=>{
     bld = req.user.bloodGroup
     res.send({"user":req.user,"Blood_group":bld})
})

//update details
router.patch('/users/me', auth ,async (req,res) => {
    const updates = Object.keys(req.body)
    const allowed = ['name','age','email','password',"location"]
    const isValidOperation = updates.every((update)=> allowed.includes(update))

    if(!isValidOperation){
        return res.status(400).send({error : 'Invalid Updates!!'})
    }

    try{
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
    }catch(e){
        res.status(400).send(e)
    }
})

//delete account
router.delete('/users/me', auth ,async(req,res)=> { 
    try{
    //    const user =  await User.findByIdAndDelete(req.user._id)
    //    if(!user){
    //        return res.status(404).send()
    //    }
        await req.user.remove()
        sendDeleteEmail(req.user.email,req.user.name)
        res.send(req.user)
    }catch(e){
        res.status(500).send()
    }
})

//Donate blood
router.get('/users/donate',auth,async(req,res)=>{ 
    let dist = {}
    const hospitalAvail = await Hospital.find({})
    // console.log(hospitalAvail)
    if(hospitalAvail.length ===0){
        res.send({"message":"No Hospital Found!!"})
    }else{
        dist = nearestFirst(req.user.latitude,req.user.longitude,hospitalAvail);
        res.send(dist)
    }
})

module.exports = router