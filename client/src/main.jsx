import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Contracts from './pages/Contracts.jsx'

/*function Register() {
  return <h2>Registro de usuario</h2>
}
function Login() {
  return <h2>Iniciar sesión</h2>
}
function Dashboard() {
  return <h2>Panel principal</h2>
}*/

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

/*ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/contracts" element={<Contracts />} />
    </Routes>
  </BrowserRouter>
)
*/
