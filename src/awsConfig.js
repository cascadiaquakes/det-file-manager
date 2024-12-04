const awsconfig = {
        Auth: {
                Cognito: {
                        // "aws_project_region": process.env.REACT_APP_AWS_REGION,
                        // "aws_cognito_region": process.env.REACT_APP_AWS_REGION,
                        userPoolId: process.env.REACT_APP_AWS_USER_POOL_ID,
                        userPoolClientId: process.env.REACT_APP_AWS_WEB_CLIENT_ID,
                        identityPoolId: process.env.REACT_APP_AWS_IDENTITY_POOL_ID,
                },
        },
        Storage: {
                S3: {
                        bucket: process.env.REACT_APP_S3_TMP_NAME, // Your existing bucket name
                        region: 'us-west-2',
                        buckets:{
                                'upload-bucket': {
                                        bucket: process.env.REACT_APP_S3_TMP_NAME, // Your existing bucket name
                                        region: 'us-west-2',
                                        },
                                'visualization-bucket':{
                                        bucket: process.env.REACT_APP_S3_PROD_NAME,
                                        region: 'us-west-2',
                                }
                        }
                },
        },
};

export default awsconfig;