import React, { useState, useEffect } from 'react';
import Header from './components/header';
import FileUpload from "./components/FileUpload";
import FileManager from "./components/public_ds_manager";
import BenchmarkLinks from "./components/BenchmarkLinks";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Amplify } from 'aws-amplify';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import { fetchUserAttributes, getCurrentUser, fetchAuthSession, signOut as amplifySignOut } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import '@aws-amplify/ui-react/styles.css';
import awsConfig from './awsConfig';

// Configure Amplify BEFORE React renders anything
Amplify.configure(awsConfig);

// small bounded retry helper
async function retry(fn, n = 3, delay = 250) {
    let err;
    for (let i = 0; i < n; i++) {
        try { return await fn(); }
        catch (e) { err = e; await new Promise(r => setTimeout(r, delay)); }
    }
    throw err;
}

function CustomSignInHeader() {
    return (
        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <h2>Welcome to the CRESCENT Platform</h2>
            <p>Access is limited to approved users. Request access by filling out this form:</p>
            <form
                action="https://formsubmit.co/24e4d1639dbcb61c2a2336fc53efb929"
                method="POST"
                style={{ maxWidth: '400px', margin: '1rem auto' }}
            >
                <input type="hidden" name="_subject" value="DET uploader Access Request" />
                <input type="hidden" name="_captcha" value="false" />
                <input type="hidden" name="_template" value="box" />
                <input
                    type="hidden"
                    name="_autoresponse"
                    value="We received your message, admins will be in touch when your account is ready"
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <input type="text" name="name" placeholder="Full Name" required />
                    <input type="email" name="email" placeholder="Email Address" required />
                    <input type="text" name="affiliation" placeholder="Affiliation (e.g. University, Agency)" />
                    <button type="submit" className="amplify-button">Request Access</button>
                </div>
            </form>
        </div>
    );
}

function AppLayout({ userAttributes, signOut }) {
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
            <BenchmarkLinks />
        </div>
    );
}

function AuthenticatedApp({ signOut }) {
    const { user } = useAuthenticator((context) => [context.user]);

    // 'loading' | 'ready' | 'error'
    const [status, setStatus] = useState('loading');
    const [userAttributes, setUserAttributes] = useState(null);

    const hydrate = async () => {
        setStatus('loading');
        try {
            // Ensure session is written after sign-in/redirect
            await retry(() => getCurrentUser(), 3, 250);
            const session = await retry(() => fetchAuthSession({ forceRefresh: false }), 3, 250);
            // Optional: const identityId = session.identityId;

            // Now it’s safe to read attributes
            const attrs = await retry(() => fetchUserAttributes(), 3, 250);
            setUserAttributes(attrs);
            setStatus('ready');
        } catch (e) {
            console.error('Auth hydrate failed:', e);
            setUserAttributes(null);
            setStatus('error');
        }
    };

    useEffect(() => {
        if (user) hydrate();
    }, [user]);

    // Rehydrate on key auth events (v6 Hub import)
    useEffect(() => {
        const unsub = Hub.listen('auth', ({ payload: { event } }) => {
            if (['signedIn', 'tokenRefresh', 'cognitoHostedUI', 'customOAuthState'].includes(event)) {
                hydrate();
            }
            if (['signedOut', 'signOut'].includes(event)) {
                setUserAttributes(null);
                setStatus('loading');
            }
        });
        return () => unsub();
    }, []);

    if (status === 'loading') {
        return <div style={{ padding: 24 }}>Loading your session…</div>;
    }

    if (status === 'error' || !userAttributes) {
        return (
            <div style={{ padding: 24 }}>
                <p>We couldn’t load your profile yet.</p>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="amplify-button" onClick={hydrate}>Try again</button>
                    <button
                        className="amplify-button"
                        onClick={async () => { await amplifySignOut(); signOut(); }}
                    >
                        Sign out
                    </button>
                </div>
            </div>
        );
    }

    return <AppLayout userAttributes={userAttributes} signOut={signOut} />;
}

export default function App() {
    return (
        <Authenticator hideSignUp components={{ Header: CustomSignInHeader }}>
            {({ signOut }) => <AuthenticatedApp signOut={signOut} />}
        </Authenticator>
    );
}
