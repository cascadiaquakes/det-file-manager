import React, { useState, useEffect } from 'react';
import { Form, Container, Alert, Spinner } from 'react-bootstrap';
import { list } from 'aws-amplify/storage';
import { StorageManager } from '@aws-amplify/ui-react-storage';

function FileUpload() {
    const [benchmarkIds, setBenchmarkIds] = useState([]);
    const [selectedBenchmarkId, setSelectedBenchmarkId] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [uploadMessage, setUploadMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Fetch benchmark IDs from the upload bucket
    const getBenchmarkIds = async () => {
        try {
            setLoading(true);
            const result = await list({
                path: 'upload/',
                options: {
                    listAll: true,
                    bucket: 'det-bucket',
                    level: 'protected',
                },
            });
            const items = result.items || [];
            const ids = items
                .filter(item => item.path && item.path.endsWith('/'))
                .map(item => {
                    const parts = item.path.split('/');
                    // parts[0] = 'upload', parts[1] = folderName, parts[2] = '' (if it ends with '/')
                    return parts[1];
                })
                .filter(id => id.trim() !== '');
            setBenchmarkIds([...new Set(ids)]);
        } catch (error) {
            console.error('Error fetching benchmark IDs:', error);
            setUploadError('Failed to fetch benchmark IDs.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getBenchmarkIds();
    }, []);

    const handleBenchmarkChange = (event) => {
        setSelectedBenchmarkId(event.target.value);
        setUploadSuccess(false);
        setUploadError(null);
        setUploadMessage('');
    };

    return (
        <Container>
            <h2>File Upload</h2>
            {uploadSuccess && <Alert variant="success" className="mt-3">{uploadMessage}</Alert>}
            {uploadError && <Alert variant="danger" className="mt-3">{uploadError}</Alert>}
            {loading && <Spinner animation="border" role="status" className="mb-3" />}

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
            </Form>

            {selectedBenchmarkId && (
                <div className="mt-4">
                    <h4>Upload a File to "{selectedBenchmarkId}"</h4>
                    <StorageManager
                        // acceptedFileTypes={['.zip']}
                        path={`upload/${selectedBenchmarkId}/`}
                        maxFileCount={1}
                        providerOptions={{
                            bucket: 'det-bucket'
                        }}
                        onUploadSuccess={(event) => {
                            console.log('Upload success:', event);
                            setUploadSuccess(true);
                            setUploadMessage('File uploaded successfully to the selected benchmark ID.');
                        }}
                        onUploadError={(error) => {
                            console.error('Upload failed:', error);
                            console.error('Full error object:', JSON.stringify(error, null, 2));

                            setUploadError('File upload failed. Please try again.');
                        }}
                    />
                </div>
            )}
        </Container>
    );
}

export default FileUpload;