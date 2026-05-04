import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

const ApiTestPage = () => {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState<string>('');

  const testApi = async (endpoint: string) => {
    setLoading(endpoint);
    try {
      const response = await fetch(`/api/admin/${endpoint}`, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      const data = await response.json();
      
      setResults(prev => ({
        ...prev,
        [endpoint]: {
          status: response.status,
          success: response.ok,
          data: data
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [endpoint]: {
          status: 'ERROR',
          success: false,
          error: error.message
        }
      }));
    }
    setLoading('');
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">🔧 Admin API Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button 
            onClick={() => testApi('dashboard')}
            disabled={loading === 'dashboard'}
            className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading === 'dashboard' ? '⏳ Testing...' : '📊 Test Dashboard API'}
          </button>
          
          <button 
            onClick={() => testApi('users')}
            disabled={loading === 'users'}
            className="p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading === 'users' ? '⏳ Testing...' : '👥 Test Users API'}
          </button>
          
          <button 
            onClick={() => testApi('orders')}
            disabled={loading === 'orders'}
            className="p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {loading === 'orders' ? '⏳ Testing...' : '📦 Test Orders API'}
          </button>
        </div>

        <div className="space-y-4">
          {Object.entries(results).map(([endpoint, result]: [string, any]) => (
            <div key={endpoint} className="border rounded-lg p-4">
              <h3 className="font-bold text-lg mb-2">
                {endpoint.toUpperCase()} API Result
              </h3>
              
              <div className={`p-3 rounded mb-2 ${
                result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                Status: {result.status} - {result.success ? '✅ SUCCESS' : '❌ FAILED'}
              </div>
              
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-60">
                {JSON.stringify(result.data || result.error, null, 2)}
              </pre>
            </div>
          ))}
        </div>
        
        {Object.keys(results).length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Click the buttons above to test the admin APIs
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ApiTestPage;