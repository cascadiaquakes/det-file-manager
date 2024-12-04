import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Alert, Spinner } from 'react-bootstrap';
import { list, uploadData } from 'aws-amplify/storage'; // Corrected import

function FileUpload() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [benchmarkIds, setBenchmarkIds] = useState([]);
    const [selectedBenchmarkId, setSelectedBenchmarkId] = useState('');
    const [uploadMessage, setUploadMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Fetch benchmark IDs using the list method
    const getBenchmarkIds = async () => {
        try {
            const result = await list({
                path: '', // Root path for the bucket
                options: {
                    listAll: true, // List all items
                    bucket: 'upload-bucket',
                    level: 'protected',
                },
            });
            const items = result.items || []; // Fallback to an empty array if items is undefined
            // Extract unique folder names (benchmark IDs)
            const ids = items
                .filter(item => item.path && item.path.endsWith('/')) // Check if key exists and ends with '/'
                .map(item => item.path.split('/')[0]); // Extract the folder name

            setBenchmarkIds([...new Set(ids)]); // Remove duplicates
        } catch (error) {
            console.error('Error fetching benchmark IDs:', error);
            setUploadError('Failed to fetch benchmark IDs.');
        }
    };

    useEffect(() => {
        getBenchmarkIds();
    }, []);

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleBenchmarkChange = (event) => {
        setSelectedBenchmarkId(event.target.value);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setUploadError('Please select a file before uploading.');
            return;
        }
        if (!selectedBenchmarkId) {
            setUploadError('Please select a benchmark before uploading.');
            return;
        }

        setLoading(true);
        setUploadError(null);
        setUploadSuccess(false);

        try {
            const filePath = `${selectedBenchmarkId}/${selectedFile.name}`;
            await uploadData({
                path: filePath,
                data: selectedFile,
                options:{
                    bucket: 'upload-bucket',
                }
            });
            setUploadSuccess(true);
            setUploadMessage('File uploaded successfully to the selected benchmark ID.');
        } catch (error) {
            console.error('Upload failed:', error);
            setUploadError('File upload failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container>
            <h2>File Upload</h2>
            <Form>
                <Form.Group controlId="benchmarkSelect">
                    <Form.Label>Select Benchmark ID</Form.Label>
                    <Form.Control as="select" value={selectedBenchmarkId} onChange={handleBenchmarkChange}>
                        <option value="">-- Select a Benchmark --</option>
                        {benchmarkIds.map((id, index) => (
                            <option key={index} value={id}>
                                {id}
                            </option>
                        ))}
                    </Form.Control>
                </Form.Group>

                <Form.Group controlId="fileUpload">
                    <Form.Label>Upload File</Form.Label>
                    <Form.Control type="file" onChange={handleFileChange} />
                </Form.Group>

                <Button variant="primary" onClick={handleUpload} disabled={loading}>
                    {loading ? <Spinner animation="border" size="sm" /> : 'Upload'}
                </Button>
            </Form>

            {uploadSuccess && <Alert variant="success" className="mt-3">{uploadMessage}</Alert>}
            {uploadError && <Alert variant="danger" className="mt-3">{uploadError}</Alert>}
        </Container>
    );
}

export default FileUpload;