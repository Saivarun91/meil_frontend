import { useState, useMemo } from 'react';

function SortIcon({ state }) {
    if (state === 'asc') {
        return (
            <span className="inline-flex flex-col items-center justify-center ml-1 w-3 h-4 align-middle">
                <svg width="10" height="14" viewBox="0 0 10 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <line x1="1" y1="3" x2="9" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="1" y1="7" x2="7" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="1" y1="11" x2="5" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <polyline points="7,5 9,3 11,5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </span>
        );
    }
    if (state === 'desc') {
        return (
            <span className="inline-flex flex-col items-center justify-center ml-1 w-3 h-4 align-middle">
                <svg width="10" height="14" viewBox="0 0 10 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <line x1="1" y1="3" x2="5" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="1" y1="7" x2="7" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="1" y1="11" x2="9" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <polyline points="7,9 9,11 11,9" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </span>
        );
    }
    // neutral / unsorted
    return (
        <span className="inline-flex flex-col items-center justify-center ml-1 w-3 h-4 align-middle opacity-50">
            <svg width="10" height="14" viewBox="0 0 10 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="1" y1="3" x2="9" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="1" y1="7" x2="7" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="1" y1="11" x2="5" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
        </span>
    );
}

export function useSortableData(data, defaultKey = null) {
    const [sortConfig, setSortConfig] = useState(
        defaultKey ? { key: defaultKey, direction: 'asc' } : null
    );

    const sortedData = useMemo(() => {
        if (!sortConfig || !data) return data;
        return [...data].sort((a, b) => {
            const aVal = (a[sortConfig.key] ?? '').toString().toLowerCase();
            const bVal = (b[sortConfig.key] ?? '').toString().toLowerCase();
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig]);

    const requestSort = (key) => {
        setSortConfig(prev =>
            prev?.key === key
                ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                : { key, direction: 'asc' }
        );
    };

    const getSortIcon = (key) => {
        if (sortConfig?.key !== key) return <SortIcon state="neutral" />;
        return <SortIcon state={sortConfig.direction} />;
    };

    return { sortedData, sortConfig, requestSort, getSortIcon };
}
