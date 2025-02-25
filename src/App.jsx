import { useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css'
import Navbar from './components/Navbar'
import CalculadoraPL from './components/CalculadoraPL';
import Transporte from './components/Transporte';

function App() {
  return (
    <Router basename="/">
      <div className="h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow p-4">
          <Routes>
            <Route path="/programacion-lineal" element={<CalculadoraPL />} />
            <Route path="/problemas-transporte" element={<Transporte />} />
            {/* ...other routes... */}
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App
