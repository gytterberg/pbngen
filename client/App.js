import React, { useState, useEffect } from 'react';

import Navbar from './components/Navbar';
import Routes from './Routes';

import Canvas from './components/Canvas';

const App = ({ scriptsLoadedSuccessfully }) => {
  return (
    <div>
      <Canvas />
    </div>
  );
};

export default App;
