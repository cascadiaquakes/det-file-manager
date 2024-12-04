import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Alert, ListGroup, Spinner } from 'react-bootstrap';
import { list, remove } from 'aws-amplify/storage'; // Import Amplify Storage methods

function FileManager() {
    const [benchmarkIds, setBenchmarkIds] = useState([]);
    const [selectedBenchmarkId, setSelectedBenchmarkId] = useState('');
    const [folders, setFolders] = useState([]);
    const [deleteError, setDeleteError] = useState(null);
    const [deleteSuccess, setDeleteSuccess] = useState(false);
    const [loading, setLoading] = useState(false); // Track if data is being loaded or deleted

    // Fetch benchmark IDs using the list method
    const getBenchmarkIds = async () => {
        try {
            const result = await list({
                path: '', // Root path for the bucket
                options: {
                    listAll: true, // List all items
                    bucket: 'visualization-bucket',
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
        }
    };

    useEffect(() => {
        getBenchmarkIds();
    }, []);

    // Fetch benchmark ids (folders) from S3 for the file manager bucket
    useEffect(() => {
        const fetchFolders = async () => {
        if (!selectedBenchmarkId) {
            setFolders([]); // Reset folders if no benchmark is selected
            return;
        }

        try {
            setLoading(true);
            const result = await list({
                path: `${selectedBenchmarkId}/`, // Path scoped to the selected benchmark
                options: {
                    listAll: true,
                    bucket: 'visualization-bucket',
                },
            });
            console.log(result.items)
            const folderList = result.items
                .filter(item => item.path.endsWith('/')) // Include only folders
                .map(item => item.path.split('/')[1]); // Extract folder names
            setFolders(folderList);
        } catch (error) {
            console.error('Error fetching folders:', error);
        } finally {
            setLoading(false);
        }
    };
    fetchFolders();
    }, [selectedBenchmarkId]);

    // Handle deletion of a folder
    const handleDeleteFolder = async (folderName) => {
        if (window.confirm(`Are you sure you want to delete the folder "${folderName}" and its contents?`)) {
            try {
                setLoading(true);
                setDeleteSuccess(false);
                setDeleteError(null);

                const folderPath = `${selectedBenchmarkId}/${folderName}/`;

                // List all objects in the folder to delete
                const result = await list({
                    path: folderPath,
                    options: {
                        listAll: true,
                        bucket: 'visualization-bucket',
                    },
                });

                const deletePromises = result.items.map(item => {
                    return remove(item.key, {
                        bucket: 'visualization-bucket', // Replace with your production bucket
                    });
                });

                // Delete all objects in the folder
                await Promise.all(deletePromises);

                setDeleteSuccess(true);
                // Refresh the folders list after deletion
                setFolders(folders.filter(folder => folder !== folderName));
            } catch (error) {
                console.error('Error deleting folder:', error);
                setDeleteError(error.message || 'Failed to delete folder.');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleBenchmarkChange = (event) => {
        setSelectedBenchmarkId(event.target.value);
        setDeleteSuccess(false);
        setDeleteError(null);
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