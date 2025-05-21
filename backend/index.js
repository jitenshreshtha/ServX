const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();


const app = express();


mongoose.connect(process.env.MONGODB_URI)
.then(()=> console.log('DB connected'))
.catch(err => console.err(err));

app.get('/',(req,res)=>{
    console.log('Server is working');
    res.send("HomePage");
});


app.listen(process.env.BACK_PORT,()=>{
    console.log('Server running ');
})