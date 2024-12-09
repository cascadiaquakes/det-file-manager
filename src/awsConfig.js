const awsconfig = {
        Auth: {
                Cognito: {
                        userPoolId: process.env.REACT_APP_AWS_USER_POOL_ID,
                        userPoolClientId: process.env.REACT_APP_AWS_WEB_CLIENT_ID,
                        identityPoolId: process.env.REACT_APP_AWS_IDENTITY_POOL_ID,
                },
        },
        Storage: {
                S3: {
                        bucket: process.env.REACT_APP_S3_PROD_NAME,
                        region: 'us-west-2',
                        buckets:{
                                'det-bucket':{
                                        bucket: process.env.REACT_APP_S3_PROD_NAME,
                                        region: 'us-west-2',
                                }
                        }
                },
        },
};

export default awsconfig;