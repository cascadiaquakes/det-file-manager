import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Alert, ListGroup, Spinner } from 'react-bootstrap';
import { list, remove, getProperties } from 'aws-amplify/storage';

function FileManager({user_metadata}) {
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
            console.error('Error fetching benchmark IDs:', error?.name || error?.message);
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

            // List all items in the benchmark folder
            const result = await list({
                path: `public_ds/${selectedBenchmarkId}/`,
                options: {
                    listAll: true,
                    bucket: 'det-bucket',
                },
            });
            // Initialize an empty folder list
            const filteredFolderSet = new Set();

            // Filter items to process only `metadata.json` files
            const metadataFiles = result.items.filter((item) => item.path.endsWith('metadata.json'));

            // Fetch metadata for each `metadata.json` file
            await Promise.all(
                metadataFiles.map(async (metadataFile) => {
                    try {
                        // Fetch only the metadata of the file
                        const response = await getProperties({
                                path: metadataFile.path,
                                   options:{
                                                bucket: 'det-bucket',
                                            }
                        });
                        // // Check if the userId matches the current user's sub
                        if (response.metadata && response.metadata.userid === user_metadata.sub) {
                            const folderName = metadataFile.path.split('/')[2]; // Extract folder name
                            filteredFolderSet.add(folderName);
                        }
                    } catch (error) {
                        console.warn(`Error fetching metadata for ${metadataFile.path}:`, error?.name || error?.message);
                    }
                })
            );

            // Convert the filtered folder set to an array and update the state
            setFolders(Array.from(filteredFolderSet));
        } catch (error) {
            console.error('Error fetching folders:', error?.name || error?.message);
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
                const deletePromises = result.items.map(item => {
                    return remove({path: item.path, bucket: 'det-bucket'});
                });

                // Delete all objects in the folder
                await Promise.all(deletePromises);

                setDeleteSuccess(true);
                // Refresh the folders list after deletion
                setFolders(folders.filter(folder => folder !== folderName));
            } catch (error) {
                console.error('Error deleting folder:', error?.name || error?.message);
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
            <p>Here you can manage your previous uploads</p>
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
                <Spinner animation="border" role="status"/>
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