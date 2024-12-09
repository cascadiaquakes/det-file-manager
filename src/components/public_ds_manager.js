import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Alert, ListGroup, Spinner } from 'react-bootstrap';
import { list, remove } from 'aws-amplify/storage';

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
                path: 'public_ds/', // Root path for the bucket
                options: {
                    listAll: true, // List all items
                    bucket: 'det-bucket',
                    level: 'protected',
                },
            });
            const items = result.items || []; // Fallback to an empty array if items is undefined
            // Extract unique folder names (benchmark IDs)
            const ids = items
                .filter(item => item.path && item.path.endsWith('/'))
                .map(item => {
                    const parts = item.path.split('/');
                    // parts[0] = 'upload', parts[1] = folderName, parts[2] = '' (if it ends with '/')
                    return parts[1];
                })
                .filter(id => id.trim() !== '');

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
                path: `public_ds/${selectedBenchmarkId}/`, // Path scoped to the selected benchmark
                options: {
                    listAll: true,
                    bucket: 'det-bucket',
                },
            });
            const folderList = Array.from(
                new Set(
                    result.items
                        .map(item => {
                            const parts = item.path.split('/');
                            return parts[2];
                        })
                        .filter(name => name && name.trim() !== '') // Filter out empty or undefined
                )
            );

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

                const folderPath = `public_ds/${selectedBenchmarkId}/${folderName}/`;

                // List all objects in the folder to delete
                const result = await list({
                    path: folderPath,
                    options: {
                        listAll: true,
                        bucket: 'det-bucket',
                    },
                });
                console.log(result.items);
                const deletePromises = result.items.map(item => {
                    return remove({path: item.path, bucket: 'det-bucket'});
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
            <h2>File management</h2>
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