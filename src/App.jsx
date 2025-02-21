import { useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css'
import Navbar from './components/Navbar'
import CalculadoraPL from './components/CalculadoraPL';

function App() {
  return (
    <Router>
      <div className="h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow p-4">
          <Routes>
            <Route path="/programacion-lineal" element={<CalculadoraPL />} />
            {/* ...other routes... */}
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App
