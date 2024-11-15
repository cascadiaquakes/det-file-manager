import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Alert, ListGroup, Spinner } from 'react-bootstrap';
import AWS from 'aws-sdk';

const listFolders = async (s3, bucketName, benchmarkId, setFolders) => {
    const params = {
        Bucket: bucketName,
        Prefix: benchmarkId + '/',  // Filter by the selected benchmark
        Delimiter: '/', // This ensures we only get folders
    };

    try {
        const data = await s3.listObjectsV2(params).promise();
        const folderList = data.CommonPrefixes.map(prefix => prefix.Prefix.split('/')[1]);
        setFolders(folderList);
    } catch (err) {
        console.error('Error fetching folders:', err);
    }
};

const getBenchmarkIds = async (s3, setBenchmarkIds, bucketName) => {
    const params = {
        Bucket: bucketName,
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

const deleteFolder = async (s3, bucketName, folderPath, setDeleteSuccess, setDeleteError, setFolders, selectedBenchmarkId) => {
    try {
        const listParams = {
            Bucket: bucketName,
            Prefix: folderPath,
        };
        const data = await s3.listObjectsV2(listParams).promise();

        const deleteParams = {
            Bucket: bucketName,
            Delete: {
                Objects: data.Contents.map((file) => ({ Key: file.Key })),
            },
        };

        await s3.deleteObjects(deleteParams).promise();

        setDeleteSuccess(true);
        setDeleteError(null);

        // Refresh the folder list directly here
        await listFolders(s3, bucketName, selectedBenchmarkId, setFolders);
    } catch (err) {
        console.error('Error deleting folder:', err);
        setDeleteError(err.message);
        setDeleteSuccess(false);
    }
};

function FileManager() {
    const [benchmarkIds, setBenchmarkIds] = useState([]);
    const [selectedBenchmarkId, setSelectedBenchmarkId] = useState('');
    const [folders, setFolders] = useState([]);
    const [deleteError, setDeleteError] = useState(null);
    const [deleteSuccess, setDeleteSuccess] = useState(false);
    const [loading, setLoading] = useState(false); // Track if data is being loaded or deleted

    // Configure AWS SDK (credentials and region should be managed via environment variables or AWS CLI)
    AWS.config.update({
        accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
        region: process.env.REACT_APP_AWS_REGION || 'us-west-2',
    });

    // S3 instance for the file manager bucket (different bucket from the uploader)
    const s3 = new AWS.S3();
    const bucketName = process.env.REACT_APP_S3_PROD_NAME; // Bucket name for file management

    // Fetch benchmark ids when the component mounts
    useEffect(() => {
        getBenchmarkIds(s3, (ids) => {
            // Filter out empty or falsy values before setting the state
            setBenchmarkIds(ids.filter(id => id.trim() !== ''));
        }, bucketName);
    }, []);

    // Fetch benchmark ids (folders) from S3 for the file manager bucket
    useEffect(() => {
        if (selectedBenchmarkId) {
            setLoading(true);
            listFolders(s3, bucketName, selectedBenchmarkId, setFolders);
            setLoading(false);
        } else {
            setFolders([]); // Empty the list if no benchmark is selected
        }
    }, [selectedBenchmarkId]);

    const handleBenchmarkChange = (event) => {
        setSelectedBenchmarkId(event.target.value);
        setDeleteSuccess(false);
        setDeleteError(null);
    };

    const handleDeleteFolder = (folderName) => {
        if (window.confirm(`Are you sure you want to delete the folder "${folderName}" and its contents?`)) {
            setLoading(true);
            deleteFolder(
                s3,
                bucketName,
                `${selectedBenchmarkId}/${folderName}`,
                setDeleteSuccess,
                setDeleteError,
                setFolders,
                selectedBenchmarkId
            ).finally(() => setLoading(false));
        }
    };

    return (
        <Container className="mt-4">
            {deleteSuccess && <Alert variant="success">Folder deleted successfully!</Alert>}
            {deleteError && <Alert variant="danger">Error: {deleteError}</Alert>}

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
            </Form>

            <h4>Folders under "{selectedBenchmarkId}"</h4>

            {loading ? (
                <Spinner animation="border" role="status" />
            ) : (
                <ListGroup>
                    {folders.length === 0 ? (
                        <ListGroup.Item>No folders available under this benchmark.</ListGroup.Item>
                    ) : (
                        folders.map((folder) => (
                            <ListGroup.Item key={folder}>
                                {folder}
                                <Button
                                    variant="danger"
                                    size="sm"
                                    className="ml-2"
                                    onClick={() => handleDeleteFolder(folder)}
                                >
                                    Delete
                                </Button>
                            </ListGroup.Item>
                        ))
                    )}
                </ListGroup>
            )}
        </Container>
    );
}

export default FileManager;
