import React, { useState, useEffect } from 'react';
import Header from './components/header';
import FileUpload from "./components/FileUpload";
import AWS from 'aws-sdk';
import FileManager from "./components/public_ds_manager";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import { fetchUserAttributes, fetchAuthSession } from 'aws-amplify/auth';
import '@aws-amplify/ui-react/styles.css';
import awsConfig from './awsConfig';

// Configure Amplify in index file or root file
Amplify.configure({ ...awsConfig });

function App() {
    const [userAttributes, setUserAttributes] = useState(null);
    const [AWS, setAwsConfigured] = useState(null);

    // Fetch user attributes
    const fetchAttributes = async () => {
        try {
            const attributes = await fetchUserAttributes(); // Directly fetch attributes from Amplify
            setUserAttributes(attributes); // Set attributes in state
        } catch (e) {
            console.error('Error fetching user attributes:', e);
        }
    };

    // Configure AWS SDK with Amplify credentials
    const configureAWSSDK = async () => {
        try {
            const authSession = await fetchAuthSession(); // Get Amplify credentials
            AWS.config.update({
                region: awsConfig.aws_project_region, // Use the same region as Amplify
                credentials: authSession, // Pass Amplify credentials to AWS SDK
            });
            setAwsConfigured(AWS); // Set AWS SDK
            console.log('AWS SDK configured successfully:', AWS.config.credentials);
        } catch (e) {
            console.error('Error configuring AWS SDK:', e);
        }
    };

    useEffect(() => {
        fetchAttributes(); // Fetch attributes on component mount
        configureAWSSDK();
    }, []);

    return (
      <Authenticator hideSignUp >
          {({ signOut, user}) => (
              <div>
                  <Header/>
                  <p>Welcome user id:{user.username}, attributes {userAttributes?.email}, group {userAttributes?.['custom:group_name']}</p>
                  <FileUpload user={user} AWS={AWS}/>
                  {/*<FileManager/>*/}
                  <button onClick={signOut}>Sign out</button>
              </div>)}
      </Authenticator>
  );
}

export default App;