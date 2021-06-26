import React, { useState, useEffect } from 'react';
// import ScriptLoader from 'react-script-loader-hoc';

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

// export default ScriptLoader(
//   'https://cdn.jsdelivr.net/gh/wallat/compiled-opencvjs/v4.2.0/opencv.js'
// )(App);

export default App;
