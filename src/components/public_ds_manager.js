import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Alert, ListGroup, Spinner } from 'react-bootstrap';
import { list, remove, getProperties, downloadData } from 'aws-amplify/storage';

function FileManager({ user_metadata }) {
    const [benchmarkIds, setBenchmarkIds] = useState([]);
    const [selectedBenchmarkId, setSelectedBenchmarkId] = useState('');
    const [folders, setFolders] = useState([]);
    const [deleteError, setDeleteError] = useState(null);
    const [deleteSuccess, setDeleteSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    // 1) Fetch benchmark IDs from manifest (no listAll crawl)
    const getBenchmarkIds = async () => {
        try {
            setLoading(true);

            const { body } = await downloadData({
                path: 'public_ds/benchmarks_list.json',
                options: { level: 'protected' },
            }).result;

            const manifest = JSON.parse(await body.text());

            const publicGroup = manifest?.groups?.public;
            if (!Array.isArray(publicGroup)) {
                throw new Error('benchmarks_list.json missing groups.public array');
            }

            const ids = publicGroup
                .map((b) => (typeof b?.id === 'string' ? b.id.trim() : ''))
                .filter(Boolean);

            const unique = [...new Set(ids)];
            setBenchmarkIds(unique);

            // If nothing selected yet, default to first benchmark
            setSelectedBenchmarkId((prev) => prev || unique[0] || '');
        } catch (error) {
            console.error('Error fetching benchmark IDs (manifest):', error?.name || error?.message || error);
            setDeleteError('Failed to load benchmark list.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getBenchmarkIds();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 2) Fetch user-owned folders under selected benchmark
    useEffect(() => {
        let cancelled = false;

        const fetchFolders = async () => {
            if (!selectedBenchmarkId) {
                setFolders([]);
                return;
            }

            try {
                setLoading(true);

                const result = await list({
                    path: `public_ds/${selectedBenchmarkId}/`,
                    options: {
                        listAll: true,
                        level: 'protected',
                    },
                });

                const items = result.items || [];

                // Only look at metadata.json files
                const metadataFiles = items.filter((item) => item.path && item.path.endsWith('metadata.json'));

                const filteredFolderSet = new Set();

                await Promise.all(
                    metadataFiles.map(async (metadataFile) => {
                        try {
                            const response = await getProperties({
                                path: metadataFile.path,
                                options: { level: 'protected' },
                            });

                            if (response?.metadata?.userid === user_metadata.sub) {
                                // public_ds/<benchmarkId>/<folderName>/metadata.json
                                const parts = metadataFile.path.split('/');
                                const folderName = parts[2];
                                if (folderName) filteredFolderSet.add(folderName);
                            }
                        } catch (error) {
                            console.warn(
                                `Error fetching properties for ${metadataFile.path}:`,
                                error?.name || error?.message || error
                            );
                        }
                    })
                );

                if (!cancelled) setFolders(Array.from(filteredFolderSet));
            } catch (error) {
                console.error('Error fetching folders:', error?.name || error?.message || error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchFolders();
        return () => {
            cancelled = true;
        };
    }, [selectedBenchmarkId, user_metadata.sub]);

    // Handle deletion of a folder
    const handleDeleteFolder = async (folderName) => {
        if (!selectedBenchmarkId || !folderName) return;

        if (window.confirm(`Are you sure you want to delete the folder "${folderName}" and its contents?`)) {
            try {
                setLoading(true);
                setDeleteSuccess(false);
                setDeleteError(null);

                const folderPath = `public_ds/${selectedBenchmarkId}/${folderName}/`;

                const result = await list({
                    path: folderPath,
                    options: {
                        listAll: true,
                        level: 'protected',
                    },
                });

                const items = result.items || [];

                await Promise.all(
                    items.map((item) =>
                        remove({
                            path: item.path,
                            options: { level: 'protected' },
                        })
                    )
                );

                setDeleteSuccess(true);
                setFolders((prev) => prev.filter((f) => f !== folderName));
            } catch (error) {
                console.error('Error deleting folder:', error?.name || error?.message || error);
                setDeleteError(error?.message || 'Failed to delete folder.');
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
                            <ListGroup.Item key={folder} className="d-flex justify-content-between align-items-center">
                                <span>{folder}</span>
                                <Button variant="danger" size="sm" onClick={() => handleDeleteFolder(folder)}>
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