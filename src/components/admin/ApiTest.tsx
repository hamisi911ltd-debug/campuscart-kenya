import { useState } from 'react';

const ApiTest = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testDashboardApi = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/dashboard', {
        method: 'GET',
        credentials: 'include', // Include cookies
      });
      
      const data = await response.json();
      
      setTestResult(`
Status: ${response.status}
Response: ${JSON.stringify(data, null, 2)}
      `);
    } catch (error) {
      setTestResult(`Error: ${error}`);
    }
    setLoading(false);
  };

  const testUsersApi = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        credentials: 'include',
      });
      
      const data = await response.json();
      
      setTestResult(`
Status: ${response.status}
Response: ${JSON.stringify(data, null, 2)}
      `);
    } catch (error) {
      setTestResult(`Error: ${error}`);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4">
      <h3 className="font-bold mb-2">API Test</h3>
      <div className="flex gap-2 mb-4">
        <button 
          onClick={testDashboardApi}
          disabled={loading}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Test Dashboard API
        </button>
        <button 
          onClick={testUsersApi}
          disabled={loading}
          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Test Users API
        </button>
      </div>
      {testResult && (
        <pre className="text-xs bg-black text-green-400 p-2 rounded overflow-auto max-h-40">
          {testResult}
        </pre>
      )}
    </div>
  );
};

export default ApiTest;