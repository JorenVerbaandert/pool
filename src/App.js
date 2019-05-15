import React from 'react';
import './App.css';
import Canvas from "./canvas";

import logo from './images/logo.jpg'; 

function App() {
  return (
    <div className="App">
      <img src={logo} alt="Logo" />
      <Canvas/>
    </div>
  );
}

export default App;
