const app = require('./app')

const port = process.env.PORT

//listen
app.listen(port,()=>{
    console.log('Server up at ,',port)
})