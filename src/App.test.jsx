import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

// Smoke tests. The app is gated by Amplify Authenticator, so without an
// authenticated session it renders the sign-in screen (async, after Amplify
// finishes its auth state check). These tests prove:
//   - The component tree compiles and Amplify.configure() doesn't throw.
//   - The custom sign-in header is wired into Authenticator.
// Anything deeper (authenticated flows) would need mocking the Amplify
// auth context, which we haven't taken on yet.

describe('App', () => {
  it('renders the custom CRESCENT sign-in header once auth state resolves', async () => {
    render(<App />);
    expect(
      await screen.findByRole(
        'heading',
        { name: /welcome to the crescent platform/i },
        { timeout: 5000 }
      )
    ).toBeInTheDocument();
  });

  it('shows the access-request form on the sign-in screen', async () => {
    render(<App />);
    expect(
      await screen.findByPlaceholderText(/full name/i, {}, { timeout: 5000 })
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /request access/i })).toBeInTheDocument();
  });
});
