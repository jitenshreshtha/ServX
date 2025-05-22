const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();


const app = express();


app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
.then(()=> console.log('DB connected'))
.catch(err => console.error(err));

app.get('/',(req,res)=>{
    console.log('Server is working');
    res.send("HomePage");
});


app.listen(process.env.BACK_PORT,()=>{
    console.log('Server running ');
})