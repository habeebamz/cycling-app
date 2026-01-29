
'use client';

import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import api from '@/lib/api';

export default function DebugPage() {
    const [logs, setLogs] = useState<string[]>([]);
    const [token, setToken] = useState<string | undefined>('');

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

    useEffect(() => {
        runChecks();
    }, []);

    const runChecks = async () => {
        addLog('Starting Debug Checks...');

        // 1. Check Cookie
        const t = Cookies.get('token');
        setToken(t);
        addLog(`Cookie 'token': ${t ? 'Present (' + t.substring(0, 10) + '...)' : 'MISSING'}`);

        if (!t) {
            addLog('No token found. Cannot proceed with API check.');
            return;
        }

        // 2. Check API
        try {
            addLog('Calling /api/auth/me...');
            const res = await api.get('/auth/me');
            addLog(`API Success! User: ${res.data.username} (${res.data.role})`);
        } catch (error: any) {
            addLog(`API Failed: ${error.message}`);
            if (error.response) {
                addLog(`Status: ${error.response.status}`);
                addLog(`Data: ${JSON.stringify(error.response.data)}`);
            }
        }
    };

    return (
        <div className="p-8 font-mono text-sm">
            <h1 className="text-xl font-bold mb-4">Auth Debugger</h1>
            <button onClick={runChecks} className="bg-blue-500 text-white px-4 py-2 rounded mb-4">Re-run Checks</button>
            <div className="bg-gray-100 p-4 rounded border border-gray-300 whitespace-pre-wrap">
                {logs.map((log, i) => (
                    <div key={i}>{log}</div>
                ))}
            </div>
            <div className="mt-4">
                <p><strong>Token:</strong> {token || 'None'}</p>
            </div>
        </div>
    );
}
