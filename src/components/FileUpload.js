import React, { useState, useEffect } from 'react';
import { Form, Container, Alert, Spinner } from 'react-bootstrap';
import { list } from 'aws-amplify/storage';
import { StorageManager } from '@aws-amplify/ui-react-storage';


function FileUpload({user_metadata}) {
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

    const processFile = async ({ file, key }) => {
        try {
            // Return the file with metadata
            return {
                file,
                key, // Use the generated or provided key
                metadata: {
                    userid: user_metadata.sub,
                    useremail: user_metadata.email,
                    usergroup: user_metadata['custom:group_name'],
                    benchmarkId: selectedBenchmarkId, // Add any other relevant metadata
                },
            };
        } catch (error) {
            console.error('Error fetching user info:', error);
            throw new Error('Unable to fetch user info for metadata');
        }
    };

    return (
        <Container>
            <h2>File Upload</h2>
            <p>Upload your solution as a .zip after selecting the correct benchmark</p>
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
                        acceptedFileTypes={['.zip']}
                        path={`upload/${selectedBenchmarkId}/`}
                        maxFileCount={1}
                        processFile={processFile}
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