const express = require('express')
const User = require('../models/user')
const Hospital = require('../models/hospital')
const auth = require('../middleware/hospitalauth')
const {sendwelcomeEmail , sendDeleteEmail,sendRequestBlood} = require('../emails/account')
const geocode = require('../utils/geocode')
const router = new express.Router()
const nearestFirst = require('../utils/nearest')


router.post('/hospital/signup', async (req,res)=>{
   
    const user = new Hospital(req.body)
    try{
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

router.post('/hospital/login',async(req,res)=>{
    try{
        const user = await Hospital.findByCredentials(req.body.email,req.body.password)
        const token = await user.generateAuthToken()
        res.send({user,token})
    }catch(e){
        res.status(400).send()
    }

})

router.post('/hospital/logout', auth ,async (req,res)=>{
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

router.post('/hospital/logoutAll', auth , async(req,res) =>{
    try{
        req.user.tokens = []
        await req.user.save()
        res.send()
    }catch(e){
        res.status(500).send()
    }

})

router.get('/hospital/me',auth,async(req,res)=>{ 
     res.send({"user":req.user})
})

router.patch('/hospital/me', auth ,async (req,res) => {
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

router.delete('/hospital/me', auth ,async(req,res)=> { 
    try{ 
        await req.user.remove()
        sendDeleteEmail(req.user.email,req.user.name)
        res.send(req.user)
    }catch(e){
        res.status(500).send()
    }
})

//request blood
router.post('/hospital/getbloodgroup',auth,async(req,res)=>{
    const usersAvail = await User.find({bloodGroup:req.body.bloodGroup})
    console.log(usersAvail)
    if(usersAvail.length ===0){
        res.send({"message":"A user with requested Blood Group not available"})
    }else{
        for(i=0;i<usersAvail.length;i++){
            sendRequestBlood(usersAvail[i].email,usersAvail[i].name,usersAvail[i].bloodGroup,req.user.name)
        }
        let dist = {}
        dist = nearestFirst(req.user.latitude,req.user.longitude,usersAvail);
        console.log(dist)
        res.send(dist)
    }
})


module.exports = router
