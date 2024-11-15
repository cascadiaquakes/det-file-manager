import React from 'react';
import Header from './components/header';
import FileUpload from "./components/FileUpload";
import FileManager from "./components/public_ds_manager";

import 'bootstrap/dist/css/bootstrap.min.css';


function App() {
  return (
      <div>
          <Header />
          <FileUpload/>
          <FileManager/>
      </div>
  );
}

export default App;