import React, { useState, useEffect } from 'react';
import Header from './components/header';
import FileUpload from "./components/FileUpload";
import FileManager from "./components/public_ds_manager";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Amplify } from 'aws-amplify';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import '@aws-amplify/ui-react/styles.css';
import awsConfig from './awsConfig';

// Configure Amplify in index file or root file
Amplify.configure({ ...awsConfig });

function CustomSignInHeader() {
    return (
        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <h2>Welcome to the CRESCENT Platform</h2>
            <p>
                Access is limited to approved users. Request access by filling out this form:
            </p>
            <form
                action="https://formsubmit.co/24e4d1639dbcb61c2a2336fc53efb929"
                method="POST"
                style={{maxWidth: '400px', margin: '1rem auto'}}
            >
                <input type="hidden" name="_subject" value="DET uploader Access Request"/>
                <input type="hidden" name="_captcha" value="false"/>
                <input type="hidden" name="_template" value="box"/>
                <input type="hidden" name="_autoresponse" value="We received your message, admins will be in touch when your account is ready"/>
                <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                    <input type="text" name="name" placeholder="Full Name" required/>
                    <input type="email" name="email" placeholder="Email Address" required/>
                    <input type="text" name="affiliation" placeholder="Affiliation (e.g. University, Agency)"/>
                    <button type="submit" className="amplify-button">Request Access</button>
                </div>
            </form>
        </div>
    );
}

function AppLayout({user, userAttributes, signOut}) {
    return (
        <div>
            <Header user={userAttributes} signOut={signOut} />
            <div style={{ display: 'flex', gap: '20px', padding: '20px' }}>
                <div style={{ flex: 1 }}>
                    <FileUpload user_metadata={userAttributes} />
                </div>
                <div style={{ flex: 1 }}>
                    <FileManager user_metadata={userAttributes} />
                </div>
            </div>
        </div>
    );
}

function AuthenticatedApp({ signOut }) {
    const { user } = useAuthenticator((context) => [context.user]);
    const [userAttributes, setUserAttributes] = useState(null);

    useEffect(() => {
        const fetchAttrs = async () => {
            try {
                const attrs = await fetchUserAttributes();
                setUserAttributes(attrs);
            } catch (err) {
                console.error('Error fetching user attributes:', err);
            }
        };

        if (user && !userAttributes) {
            fetchAttrs();
        }
    }, [user]);

    return <AppLayout user={user} userAttributes={userAttributes} signOut={signOut}/>;
}

export default function App() {
    return (
        <Authenticator hideSignUp components={{ Header: CustomSignInHeader }}>
            {({ signOut }) => <AuthenticatedApp signOut={signOut} />}
        </Authenticator>
    );
}