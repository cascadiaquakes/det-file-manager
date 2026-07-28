import React, { useEffect, useState } from 'react';
import { downloadData } from 'aws-amplify/storage';

const BenchmarkLinks = () => {
    const [benchmarkIds, setBenchmarkIds] = useState([]);
    const [selectedId, setSelectedId] = useState('');
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        let cancelled = false;

        const loadBenchmarks = async () => {
            try {
                setErrorMsg('');

                const { body } = await downloadData({
                    path: 'public_ds/benchmarks_list.json',
                    options: {
                        level: 'protected',
                    },
                }).result;

                const text = await body.text();
                const manifest = JSON.parse(text);

                // expecting: { groups: { public: [ { id, prefix }, ... ], upload: [...] } }
                const publicGroup = manifest?.groups?.public;
                if (!Array.isArray(publicGroup)) {
                    throw new Error('benchmarks_list.json is missing groups.public (expected an array)');
                }

                const ids = publicGroup
                    .map((b) => (typeof b?.id === 'string' ? b.id.trim() : ''))
                    .filter(Boolean);

                const uniqueIds = [...new Set(ids)];

                if (!cancelled) {
                    setBenchmarkIds(uniqueIds);
                    if (uniqueIds.length > 0) setSelectedId(uniqueIds[0]);
                }
            } catch (err) {
                console.error('Error loading benchmarks_list.json:', err);
                if (!cancelled) {
                    setBenchmarkIds([]);
                    setSelectedId('');
                    setErrorMsg(err?.message || String(err));
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadBenchmarks();
        return () => {
            cancelled = true;
        };
    }, []);

    const handleGoToResult = () => {
        if (selectedId) {
            const url = `https://det.cascadiaquakes.org/?benchmark_id=${encodeURIComponent(selectedId)}`;
            window.open(url, '_blank');
        }
    };

    const handleGoToMain = () => {
        window.open('https://cascadiaquakes.org/det', '_blank');
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading benchmarks...</div>;

    if (errorMsg) {
        return (
            <div style={{ padding: '20px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Failed to load benchmarks</div>
                <div style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{errorMsg}</div>
            </div>
        );
    }

    if (benchmarkIds.length === 0) return <div style={{ padding: '20px' }}>No benchmark results available.</div>;

    return (
        <div
            style={{
                padding: '20px',
                borderTop: '1px solid #ccc',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: '#f9f9f9',
                flexWrap: 'wrap',
            }}
        >
            <label htmlFor="benchmark-select" style={{ fontWeight: 'bold' }}>
                View Benchmark Results:
            </label>

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
                {benchmarkIds.map((id) => (
                    <option key={id} value={id}>
                        {id}
                    </option>
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
                    marginLeft: 'auto',
                }}
            >
                Main DET Webpage
            </button>
        </div>
    );
};

export default BenchmarkLinks;