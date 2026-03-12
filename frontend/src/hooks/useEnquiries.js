import { useState, useEffect, useCallback } from 'react';

const API_URL = "https://script.google.com/macros/s/AKfycbwAa8i5k1Faw2MZKOMUgDljqmATAg-n1fD-NNzc5jUR3qbfPE0BfaRjGBS2TAaVQkw/exec";
const CACHE_DURATION = 30 * 1000; // 30 seconds

export const useEnquiries = (sheetName = 'Enquiries') => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    // Dynamic Cache Key: Ensures 'Enquiries' and 'Announcements' don't overwrite each other
    const cacheKey = `nexus_cache_${sheetName}`;

    const fetchData = useCallback(async (forceRefresh = false) => {
        setLoading(true);
        setError(null);

        // 1. Check Cache
        if (!forceRefresh) {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                try {
                    const { data: cachedData, timestamp } = JSON.parse(cached);
                    const isFresh = (Date.now() - timestamp) < CACHE_DURATION;
                    
                    if (isFresh) {
                        console.log(`Using cached data for ${sheetName}`);
                        setData(cachedData);
                        setLastUpdated(timestamp);
                        setLoading(false);
                        return;
                    }
                } catch (e) {
                    console.warn("Cache parsing error", e);
                    localStorage.removeItem(cacheKey);
                }
            }
        }

        // 2. Fetch from Network
        try {
            console.log(`Fetching ${sheetName} from Google Sheets...`);
            // Ensure we pass the specific sheetName to the API
            const response = await fetch(`${API_URL}?action=getSheetData&sheet=${sheetName}`);
            const result = await response.json();

            if (result.data) {
                setData(result.data);
                setLastUpdated(Date.now());
                
                // Save to specific cache key
                localStorage.setItem(cacheKey, JSON.stringify({
                    data: result.data,
                    timestamp: Date.now()
                }));
            } else {
                throw new Error(result.error || 'Failed to fetch data');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [sheetName, cacheKey]);

    // Initial Fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Close Enquiry Action
    const closeEnquiry = async (phone) => {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'closeEnquiry', phone: phone, sheet: sheetName })
            });
            const result = await response.json();
            
            if (result.success) {
                // Remove from local state immediately
                setData(current => current.filter(row => row.Phone !== phone));
                
                // Invalidate specific cache so next fetch is fresh
                localStorage.removeItem(cacheKey); 
                
                return { success: true, message: result.status };
            } else {
                throw new Error(result.error || "Failed to close");
            }
        } catch (err) {
            return { success: false, message: err.message };
        }
    };

    return { data, loading, error, lastUpdated, refresh: () => fetchData(true), closeEnquiry };
};