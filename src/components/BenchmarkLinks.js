import React, { useEffect, useState } from 'react';
import { list } from 'aws-amplify/storage'; // adjust as needed

const BenchmarkLinks = () => {
    const [benchmarkIds, setBenchmarkIds] = useState([]);
    const [selectedId, setSelectedId] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getBenchmarkIds = async () => {
            try {
                const result = await list({
                    path: 'public_ds/',
                    options: {
                        listAll: true,
                        bucket: 'det-bucket',
                        level: 'protected',
                    },
                });

                const items = result.items || [];
                const ids = items
                    .filter(item => item.path && item.path.endsWith('/'))
                    .map(item => item.path.split('/')[1])
                    .filter(id => id.trim() !== '');

                const uniqueIds = [...new Set(ids)];
                setBenchmarkIds(uniqueIds);
                if (uniqueIds.length > 0) setSelectedId(uniqueIds[0]);
            } catch (error) {
                console.error('Error fetching benchmark IDs:', error?.name || error?.message);
            } finally {
                setLoading(false);
            }
        };

        getBenchmarkIds();
    }, []);

    const handleGoToResult = () => {
        if (selectedId) {
            const url = `https://det.cascadiaquakes.org/?benchmark_id=${selectedId}`;
            window.open(url, '_blank');
        }
    };

    const handleGoToMain = () => {
        window.open('https://cascadiaquakes.org/det', '_blank');
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading benchmarks...</div>;
    if (benchmarkIds.length === 0) return <div style={{ padding: '20px' }}>No benchmark results available.</div>;

    return (
        <div style={{
            padding: '20px',
            borderTop: '1px solid #ccc',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: '#f9f9f9',
            flexWrap: 'wrap'
        }}>
            <label htmlFor="benchmark-select" style={{ fontWeight: 'bold' }}>View Benchmark Results:</label>
            <select
                id="benchmark-select"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                style={{
                    padding: '6px 12px',
                    fontSize: '16px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    backgroundColor: '#fff',
                }}
            >
                {benchmarkIds.map(id => (
                    <option key={id} value={id}>{id}</option>
                ))}
            </select>
            <button
                onClick={handleGoToResult}
                style={{
                    padding: '6px 16px',
                    fontSize: '16px',
                    borderRadius: '4px',
                    backgroundColor: '#007BFF',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                }}
            >
                Go to Result
            </button>
            <button
                onClick={handleGoToMain}
                style={{
                    padding: '6px 16px',
                    fontSize: '16px',
                    borderRadius: '4px',
                    backgroundColor: '#6c757d',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    marginLeft: 'auto'
                }}
            >
                Main DET Webpage
            </button>
        </div>
    );
};

export default BenchmarkLinks;
