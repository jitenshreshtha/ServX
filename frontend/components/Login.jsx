import React,{useState} from 'react'
import Header from './Header';
import Footer from './Footer';

function Login() {
    const [formData,setFormData] = useState({
        email:'',
        password:''
    })
    const handleSubmit =(e)=>{
        e.preventDefault();
    }
  return (
    <div>
        <Header />
        <form onSubmit={handleSubmit}>
            <div>
                <label>Email</label>
                <input type='email' value={formData.email} onChange={(e)=> setFormData({...formData,email:e.target.value})}/>
            </div>
            <div>
                <label>Password:</label>
                <input type='password' value={formData.password} onChange={(e)=>setFormData({...formData,password:e.target.value})}/>
            </div>
            <button type='submit'>Submit</button>
        </form>
        <Footer />
    </div>
  )
}

export default Login