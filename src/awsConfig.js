// Amplify v6-style config using CRA env vars
const awsconfig = {
  Auth: {
    Cognito: {
      region: process.env.REACT_APP_AWS_REGION,
      userPoolId: process.env.REACT_APP_AWS_USER_POOL_ID,
      userPoolClientId: process.env.REACT_APP_AWS_WEB_CLIENT_ID,
      identityPoolId: process.env.REACT_APP_AWS_IDENTITY_POOL_ID,
      // If you use Hosted UI, keep domain here (redirects handled elsewhere)
      loginWith: {
        oauth: {
          domain: process.env.REACT_APP_COGNITO_DOMAIN,
        },
      },
    },
  },
  Storage: {
    S3: {
      bucket: process.env.REACT_APP_S3_PROD_NAME,
      region: process.env.REACT_APP_AWS_REGION,
    },
  },
  API: {
    REST: {
      detApi: {
        endpoint: process.env.REACT_APP_API_URL,
        region: process.env.REACT_APP_AWS_REGION,
      },
    },
  },
};

export default awsconfig;
