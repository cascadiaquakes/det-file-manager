import React, { useState, useEffect } from 'react';
import Header from './components/header';
import FileUpload from "./components/FileUpload";
import FileManager from "./components/public_ds_manager";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import '@aws-amplify/ui-react/styles.css';
import awsConfig from './awsConfig';

// Configure Amplify in index file or root file
Amplify.configure({ ...awsConfig });

function App() {
    const [userAttributes, setUserAttributes] = useState(null);

    // Fetch user attributes
    const fetchAttributes = async () => {
        try {
            const attributes = await fetchUserAttributes(); // Directly fetch attributes from Amplify
            setUserAttributes(attributes); // Set attributes in state
        } catch (e) {
            console.error('Error fetching user attributes:', e);
        }
    };

    useEffect(() => {
        fetchAttributes(); // Fetch attributes on component mount
    }, []);

    return (
      <Authenticator hideSignUp >
          {({ signOut, user}) => (
              <div>
                  <Header/>
                  <p>Welcome user id:{user.username}, attributes {userAttributes?.email}, group {userAttributes?.['custom:group_name']}</p>
                  <FileUpload/>
                  <FileManager/>
                  <button onClick={signOut}>Sign out</button>
              </div>)}
      </Authenticator>
  );
}

export default App;