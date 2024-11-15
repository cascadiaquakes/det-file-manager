import React, { useState } from 'react';
import Header from './components/header';
import FileUpload from "./components/FileUpload";

import 'bootstrap/dist/css/bootstrap.min.css';


function App() {
  return (
      <div>
        <Header />
        <FileUpload/>
      </div>
  );
}

export default App;