import React,{useState} from 'react'
import Header from '../components/Header';
import Footer from '../components/Footer';
import Login from '../components/Login';

function LoginPage() {
  return (
    <div>
       <Header />
       <Login />
       <Footer />
    </div>
  )
}

export default LoginPage