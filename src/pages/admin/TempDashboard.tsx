import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Users, ShoppingBag, DollarSign, TrendingUp, 
  Package, AlertCircle, Activity, BarChart3, RefreshCw, Database, Wifi, WifiOff, ExternalLink
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

const TempDashboard = () => {
  const [apiStatus, setApiStatus] = useState<'testing' | 'working' | 'failed'>('testing');
  const [testResults, setTestResults] = useState<any>({});
  const [lastTest, setLastTest] = useState<string>('');

  const testApis = async () => {
    setApiStatus('testing');
    const results: any = {};
    
    // Test simple API first
    try {
      const testResponse = await fetch('/api/test-admin', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      results.testApi = {
        status: testResponse.status,
        working: testResponse.ok,
        data: testResponse.ok ? await testResponse.json() : await testResponse.text()
      };
    } catch (error) {
      results.testApi = { status: 'ERROR', working: false, error: error.message };
    }

    // Test admin APIs
    const endpoints = ['dashboard', 'users', 'orders'];
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`/api/admin/${endpoint}`, {
          credentials: 'include',
          headers: { 'Cache-Control': 'no-cache' }
        });
        results[endpoint] = {
          status: response.status,
          working: response.ok,
          data: response.ok ? await response.json() : await response.text()
        };
      } catch (error) {
        results[endpoint] = { status: 'ERROR', working: false, error: error.message };
      }
    }

    setTestResults(results);
    setLastTest(new Date().toLocaleTimeString());
    
    // Determine overall status
    const anyWorking = Object.values(results).some((r: any) => r.working);
    setApiStatus(anyWorking ? 'working' : 'failed');
  };

  useEffect(() => {
    testApis();
  }, []);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent mb-2">
                🔧 ADMIN DASHBOARD - DIAGNOSTIC MODE
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Diagnosing API connectivity and database access
                {lastTest && (
                  <span className="ml-2 text-blue-600 font-semibold">
                    • Last tested: {lastTest}
                  </span>
                )}
              </p>
            </div>
            <button 
              onClick={testApis}
              disabled={apiStatus === 'testing'}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg"
            >
              <RefreshCw className={`h-5 w-5 ${apiStatus === 'testing' ? 'animate-spin' : ''}`} />
              Test APIs
            </button>
          </div>

          {/* API Status */}
          <div className={`p-6 rounded-xl border-2 ${
            apiStatus === 'working' ? 'bg-green-50 border-green-200 text-green-800' :
            apiStatus === 'failed' ? 'bg-red-50 border-red-200 text-red-800' :
            'bg-yellow-50 border-yellow-200 text-yellow-800'
          }`}>
            <div className="flex items-center gap-3">
              {apiStatus === 'working' ? <Wifi className="h-8 w-8" /> : 
               apiStatus === 'failed' ? <WifiOff className="h-8 w-8" /> :
               <RefreshCw className="h-8 w-8 animate-spin" />}
              <div>
                <div className="font-bold text-2xl">
                  {apiStatus === 'working' ? '🟢 APIS WORKING - READY FOR LIVE DATA' :
                   apiStatus === 'failed' ? '🔴 API CONNECTION FAILED - DEPLOYMENT ISSUE' :
                   '🟡 TESTING API CONNECTIONS...'}
                </div>
                <div className="text-lg mt-1">
                  {apiStatus === 'working' ? 'Admin APIs are responding correctly. Dashboard can show live data.' :
                   apiStatus === 'failed' ? 'Admin APIs are not accessible. Functions may not be deployed.' :
                   'Running connectivity tests on all admin endpoints...'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* API Test Results */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <Database className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">API Test Results</h2>
            </div>
            
            <div className="space-y-4">
              {Object.entries(testResults).map(([endpoint, result]: [string, any]) => (
                <div key={endpoint} className={`p-4 rounded-lg border ${
                  result.working ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">/api/{endpoint === 'testApi' ? 'test-admin' : `admin/${endpoint}`}</span>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      result.working ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                    }`}>
                      {result.status} {result.working ? '✅' : '❌'}
                    </span>
                  </div>
                  {result.error && (
                    <div className="text-sm text-red-600 mt-1">Error: {result.error}</div>
                  )}
                  {result.working && result.data && (
                    <div className="text-xs text-gray-600 mt-2">
                      ✅ API responding correctly
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-orange-600" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Diagnosis & Next Steps</h2>
            </div>
            
            {apiStatus === 'working' && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="font-bold text-green-800 mb-2">✅ APIs Working!</h3>
                  <p className="text-green-700 text-sm mb-3">
                    Your admin APIs are responding correctly. The dashboard can now show live data from your D1 database.
                  </p>
                  <Link 
                    to="/admin" 
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Go to Live Dashboard
                  </Link>
                </div>
              </div>
            )}

            {apiStatus === 'failed' && (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <h3 className="font-bold text-red-800 mb-2">❌ API Deployment Issue</h3>
                  <p className="text-red-700 text-sm mb-3">
                    The admin APIs are returning 404 errors. This means the Cloudflare Functions are not deployed or accessible.
                  </p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-bold text-blue-800 mb-2">🔧 How to Fix:</h3>
                  <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside">
                    <li>Push the latest code to GitHub</li>
                    <li>Trigger a new deployment on Cloudflare Pages</li>
                    <li>Ensure the functions/ directory is included in the build</li>
                    <li>Check that D1 database is bound to the Pages project</li>
                  </ol>
                </div>
              </div>
            )}

            {apiStatus === 'testing' && (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h3 className="font-bold text-yellow-800 mb-2">🔄 Testing in Progress</h3>
                <p className="text-yellow-700 text-sm">
                  Running connectivity tests on all admin API endpoints...
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Temporary Stats (Static) */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border-2 border-dashed border-gray-300 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">
            📊 Temporary Dashboard (Static Data)
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
            This shows placeholder data until the APIs are working
          </p>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-200 dark:border-gray-700">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">0</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Users</div>
              <div className="text-xs text-red-500 mt-1">API Needed</div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-200 dark:border-gray-700">
              <Package className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">0</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Products</div>
              <div className="text-xs text-red-500 mt-1">API Needed</div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-200 dark:border-gray-700">
              <ShoppingBag className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">0</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Orders</div>
              <div className="text-xs text-red-500 mt-1">API Needed</div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-200 dark:border-gray-700">
              <DollarSign className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">KES 0</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Revenue</div>
              <div className="text-xs text-red-500 mt-1">API Needed</div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default TempDashboard;