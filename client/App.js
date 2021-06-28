import React, { useState, useEffect } from 'react';

import Navbar from './components/Navbar';
import Routes from './Routes';

import Container from '@material-ui/core/Container';

import Canvas from './components/Canvas';

const App = () => {
  return (
    <Container>
      <Navbar />
      <Canvas />
    </Container>
  );
};

export default App;
