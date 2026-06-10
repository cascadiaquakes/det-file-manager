// Amplify v6-style config using Vite env vars
const awsconfig = {
  Auth: {
    Cognito: {
      region: import.meta.env.VITE_AWS_REGION,
      userPoolId: import.meta.env.VITE_AWS_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_AWS_WEB_CLIENT_ID,
      identityPoolId: import.meta.env.VITE_AWS_IDENTITY_POOL_ID,
      // If you use Hosted UI, keep domain here (redirects handled elsewhere)
      loginWith: {
        oauth: {
          domain: import.meta.env.VITE_COGNITO_DOMAIN,
        },
      },
    },
  },
  Storage: {
    S3: {
      bucket: import.meta.env.VITE_S3_PROD_NAME,
      region: import.meta.env.VITE_AWS_REGION,
    },
  },
  API: {
    REST: {
      detApi: {
        endpoint: import.meta.env.VITE_API_URL,
        region: import.meta.env.VITE_AWS_REGION,
      },
    },
  },
};

export default awsconfig;
