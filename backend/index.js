const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcrypt');
const User = require('./models/User');
const cors = require('cors');


const app = express();


app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
.then(()=> console.log('DB connected'))
.catch(err => console.error(err));


app.use(cors({
    origin: 'http://localhost:5173'
}));
app.get('/',(req,res)=>{
    console.log('Server is working');
    res.send("HomePage");
});
app.post('/signup', async (req,res)=>{
    try {
        const {email,password} = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ email });
        if(existingUser) {
            return res.status(400).json({ error: "Email already exists" });
        }

        const hashPassword = await bcrypt.hash(password,10);
        const user = new User({email,password:hashPassword});
        await user.save();
        
        // Send success response
        res.status(201).json({ message: "Signup successful!" });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
})

app.post('/login',async (req,res)=>{
    const {email,password} =req.body;
    const user = await User.findOne({email});
    if(!user || !(await bcrypt.compare(password,user.password))){
        console.log('invalid id and pw');
        return;
    }

})


app.listen(process.env.BACK_PORT,()=>{
    console.log('Server running ');
})