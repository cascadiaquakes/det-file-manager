import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Alert, Spinner } from 'react-bootstrap';
import AWS from 'aws-sdk';


const getBenchmarkIds = async (s3, setBenchmarkIds) => {
    const params = {
        Bucket: process.env.REACT_APP_S3_TMP_NAME,
        Delimiter: '/', // This ensures only folders (prefixes) are returned
    };

    try {
        const data = await s3.listObjectsV2(params).promise();
        const ids = data.CommonPrefixes.map(prefix => prefix.Prefix.split('/')[0]);
        setBenchmarkIds(ids);
    } catch (err) {
        console.error('Error fetching benchmark ids:', err);
    }
};


function FileUpload() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [benchmarkIds, setBenchmarkIds] = useState([]);
    const [selectedBenchmarkId, setSelectedBenchmarkId] = useState('');
    const [uploadMessage, setUploadMessage] = useState('');
    const [loading, setLoading] = useState(false); // Track if upload is in progress

    // Configure AWS SDK (credentials and region should be managed via environment variables or AWS CLI)
    AWS.config.update({
        accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
        region: process.env.REACT_APP_AWS_REGION || 'us-west-2',
    });

    const s3 = new AWS.S3();

    // Fetch benchmark ids when the component mounts
    useEffect(() => {
        getBenchmarkIds(s3, (ids) => {
            // Filter out empty or falsy values before setting the state
            setBenchmarkIds(ids.filter(id => id.trim() !== ''));
        });
    }, []);

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleBenchmarkChange = (event) => {
        setSelectedBenchmarkId(event.target.value);
    };

    const handleUpload = () => {
        if (!selectedFile) {
            setUploadError('Please select a file before uploading.');
            return;
        }
        if (!selectedBenchmarkId) {
            setUploadError('Please select a benchmark before uploading.');
            return;
        }
        setLoading(true);
        const params = {
            Bucket: process.env.REACT_APP_S3_TMP_NAME, // Replace with your bucket name from environment variables
            Key: `${selectedBenchmarkId}/${selectedFile.name}`,
            Body: selectedFile,
            ContentType: selectedFile.type,
        };

        s3.upload(params, (err, data) => {
            setLoading(false);
            if (err) {
                console.error('Upload failed:', err);
                setUploadError(err.message);
            } else {
                console.log('Upload successful:', data);
                setUploadSuccess(true);
                setUploadError(null);
                setUploadMessage('File uploaded successfully to the selected benchmark ID.');
            }
        });
    };

    return (
        <Container className="mt-4">
            {uploadSuccess && <Alert variant="success">{uploadMessage}</Alert>}
            {uploadError && <Alert variant="danger">Error: {uploadError}</Alert>}
            <Form>
                {/* Benchmark ID Selector */}
                <Form.Group controlId="formBenchmarkId" className="mb-3">
                    <Form.Label>Select Benchmark ID</Form.Label>
                    <Form.Control as="select" value={selectedBenchmarkId} onChange={handleBenchmarkChange}>
                        <option value="">Select Benchmark ID</option>
                        {benchmarkIds.map((id) => (
                            <option key={id} value={id}>
                                {id}
                            </option>
                        ))}
                    </Form.Control>
                </Form.Group>

                {/* File Input */}
                <Form.Group controlId="formFile" className="mb-3">
                    <Form.Label>Choose a file to upload</Form.Label>
                    <Form.Control type="file" onChange={handleFileChange} />
                </Form.Group>

                {/* Upload Button with Spinner */}
                <Button
                    variant="primary"
                    onClick={handleUpload}
                    disabled={loading} // Disable button while loading
                    className={loading ? 'btn-secondary' : ''} // Add class to gray out button when loading
                >
                    {loading ? (
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                    ) : (
                        'Upload'
                    )}
                    {loading && ' Uploading...'}
                </Button>
            </Form>
        </Container>
    );
}

export default FileUpload;
