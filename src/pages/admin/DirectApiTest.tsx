import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

const DirectApiTest = () => {
  const [apiResults, setApiResults] = useState<any>({});
  const [testing, setTesting] = useState<string>('');

  const testDirectApi = async (endpoint: string) => {
    setTesting(endpoint);
    const timestamp = Date.now();
    
    try {
      console.log(`🧪 Testing ${endpoint} API directly...`);
      
      const response = await fetch(`/api/admin/${endpoint}?test=${timestamp}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Test-Request': 'true'
        }
      });
      
      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { rawResponse: responseText };
      }
      
      setApiResults(prev => ({
        ...prev,
        [endpoint]: {
          timestamp: new Date().toLocaleTimeString(),
          status: response.status,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries()),
          data: responseData,
          rawText: responseText
        }
      }));
      
      console.log(`✅ ${endpoint} API test complete:`, {
        status: response.status,
        data: responseData
      });
      
    } catch (error) {
      console.error(`❌ ${endpoint} API test failed:`, error);
      setApiResults(prev => ({
        ...prev,
        [endpoint]: {
          timestamp: new Date().toLocaleTimeString(),
          status: 'ERROR',
          ok: false,
          error: error.message,
          data: null
        }
      }));
    }
    
    setTesting('');
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-center">🔧 Direct API Testing Tool</h1>
        <p className="text-center text-gray-600 mb-8">
          Test the admin APIs directly to see if they're working and returning real data
        </p>
        
        {/* Test Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button 
            onClick={() => testDirectApi('dashboard')}
            disabled={testing === 'dashboard'}
            className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all shadow-lg"
          >
            <div className="text-2xl mb-2">📊</div>
            <div className="font-bold">Test Dashboard API</div>
            <div className="text-sm opacity-90">
              {testing === 'dashboard' ? '⏳ Testing...' : 'Check stats endpoint'}
            </div>
          </button>
          
          <button 
            onClick={() => testDirectApi('users')}
            disabled={testing === 'users'}
            className="p-6 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 transition-all shadow-lg"
          >
            <div className="text-2xl mb-2">👥</div>
            <div className="font-bold">Test Users API</div>
            <div className="text-sm opacity-90">
              {testing === 'users' ? '⏳ Testing...' : 'Check users endpoint'}
            </div>
          </button>
          
          <button 
            onClick={() => testDirectApi('orders')}
            disabled={testing === 'orders'}
            className="p-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 transition-all shadow-lg"
          >
            <div className="text-2xl mb-2">📦</div>
            <div className="font-bold">Test Orders API</div>
            <div className="text-sm opacity-90">
              {testing === 'orders' ? '⏳ Testing...' : 'Check orders endpoint'}
            </div>
          </button>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {Object.entries(apiResults).map(([endpoint, result]: [string, any]) => (
            <div key={endpoint} className="border-2 rounded-xl overflow-hidden">
              {/* Header */}
              <div className={`p-4 font-bold text-lg ${
                result.ok ? 'bg-green-100 text-green-800 border-green-200' : 
                'bg-red-100 text-red-800 border-red-200'
              }`}>
                <div className="flex justify-between items-center">
                  <span>🔗 /api/admin/{endpoint}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span>Status: {result.status}</span>
                    <span>Time: {result.timestamp}</span>
                    <span className={`px-2 py-1 rounded ${
                      result.ok ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                    }`}>
                      {result.ok ? '✅ SUCCESS' : '❌ FAILED'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Response Data */}
              <div className="p-4 bg-gray-50">
                <h4 className="font-semibold mb-2">Response Data:</h4>
                <pre className="bg-black text-green-400 p-4 rounded text-xs overflow-auto max-h-80 whitespace-pre-wrap">
{result.data ? JSON.stringify(result.data, null, 2) : result.rawText || result.error}
                </pre>
              </div>
              
              {/* Headers */}
              {result.headers && (
                <div className="p-4 bg-gray-100 border-t">
                  <h4 className="font-semibold mb-2">Response Headers:</h4>
                  <pre className="bg-gray-800 text-gray-300 p-3 rounded text-xs overflow-auto max-h-40">
{JSON.stringify(result.headers, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {Object.keys(apiResults).length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <div className="text-6xl mb-4">🧪</div>
            <h3 className="text-xl font-semibold mb-2">Ready to Test APIs</h3>
            <p>Click the buttons above to test each admin API endpoint directly</p>
          </div>
        )}
        
        {/* Instructions */}
        <div className="mt-12 p-6 bg-blue-50 rounded-xl border border-blue-200">
          <h3 className="font-bold text-blue-900 mb-3">🔍 What to Look For:</h3>
          <ul className="text-blue-800 space-y-2 text-sm">
            <li><strong>✅ Success (200):</strong> API is working and returning data</li>
            <li><strong>❌ 401 Unauthorized:</strong> Admin session not valid - try logging in again</li>
            <li><strong>❌ 404 Not Found:</strong> API endpoint doesn't exist or isn't deployed</li>
            <li><strong>❌ 500 Server Error:</strong> Database connection or server issue</li>
            <li><strong>📊 Data Check:</strong> Look for "totalUsers", "totalProducts", etc. in the response</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DirectApiTest;