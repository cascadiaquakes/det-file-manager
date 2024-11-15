import React, { useState } from 'react';
import { Form, Button, Container, Alert } from 'react-bootstrap';
import AWS from 'aws-sdk';

function FileUpload() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [uploadError, setUploadError] = useState(null);

    // Configure AWS SDK (replace with actual region and credentials)
    AWS.config.update({
        region: 'your-region',
        accessKeyId: 'your-access-key',
        secretAccessKey: 'your-secret-key',
    });

    const s3 = new AWS.S3();

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleUpload = () => {
        if (!selectedFile) {
            setUploadError('Please select a file before uploading.');
            return;
        }

        const params = {
            Bucket: 'your-bucket-name', // Replace with your bucket name
            Key: selectedFile.name,
            Body: selectedFile,
            ContentType: selectedFile.type,
        };

        s3.upload(params, (err, data) => {
            if (err) {
                console.error('Upload failed:', err);
                setUploadError(err.message);
            } else {
                console.log('Upload successful:', data);
                setUploadSuccess(true);
                setUploadError(null);
            }
        });
    };

    return (
        <Container className="mt-4">
            {uploadSuccess && <Alert variant="success">File uploaded successfully!</Alert>}
            {uploadError && <Alert variant="danger">Error: {uploadError}</Alert>}
            <Form>
                <Form.Group controlId="formFile" className="mb-3">
                    <Form.Label>Choose a file to upload</Form.Label>
                    <Form.Control type="file" onChange={handleFileChange} />
                </Form.Group>
                <Button variant="primary" onClick={handleUpload}>
                    Upload
                </Button>
            </Form>
        </Container>
    );
}

export default FileUpload;
