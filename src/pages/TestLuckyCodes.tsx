import { useState, useEffect } from "react";
import { PageShell } from "@/components/PageShell";
import { useShop } from "@/store/shop";
import { Gift, Database, User, Wallet } from "lucide-react";
import { toast } from "sonner";
import { LuckyCodeTestPanel } from "@/components/LuckyCodeTestPanel";

const TestLuckyCodes = () => {
  const { user } = useShop();
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testCode, setTestCode] = useState('WELCOME500');

  const runSystemTest = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test-lucky-codes');
      const data = await response.json();
      setTestResult(data);
      
      if (data.success) {
        toast.success('Lucky codes system is ready!');
      } else {
        toast.error('System test failed');
      }
    } catch (error) {
      console.error('Test error:', error);
      toast.error('Failed to run system test');
      setTestResult({ success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const testRedemption = async () => {
    if (!user?.id) {
      toast.error('Please sign in first');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/lucky-codes/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: testCode,
          userId: user.id 
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Success! Earned ${data.points} points`);
      } else {
        toast.error(data.error || 'Redemption failed');
      }
      
      console.log('Redemption result:', data);
    } catch (error) {
      console.error('Redemption error:', error);
      toast.error('Failed to redeem code');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runSystemTest();
  }, []);

  return (
    <PageShell title="Lucky Codes Test" noIndex>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Gift className="h-6 w-6 text-purple-500" />
            Lucky Codes System Test
          </h1>
          
          {/* User Status */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              User Status
            </h3>
            {user ? (
              <div className="space-y-1 text-sm">
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>ID:</strong> {user.id || 'No ID'}</p>
                <p><strong>Wallet Balance:</strong> {user.walletBalance || 0} points (KES {((user.walletBalance || 0) / 10).toFixed(2)})</p>
              </div>
            ) : (
              <p className="text-red-600">Not signed in - please sign in to test redemption</p>
            )}
          </div>

          {/* System Test Results */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Database className="h-4 w-4" />
                System Test Results
              </h3>
              <button
                onClick={runSystemTest}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {isLoading ? 'Testing...' : 'Run Test'}
              </button>
            </div>
            
            {testResult && (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Test Redemption */}
          <div className="mb-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Test Code Redemption
            </h3>
            
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Test Code</label>
                <input
                  type="text"
                  value={testCode}
                  onChange={(e) => setTestCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
                  placeholder="Enter lucky code"
                />
              </div>
              <button
                onClick={testRedemption}
                disabled={isLoading || !user?.id}
                className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
              >
                {isLoading ? 'Redeeming...' : 'Test Redeem'}
              </button>
            </div>
          </div>

          {/* Local Test Panel */}
          <LuckyCodeTestPanel />

          {/* Available Test Codes */}
          {testResult?.testCodes && (
            <div>
              <h3 className="font-semibold mb-4">Available Test Codes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {testResult.testCodes.map((code: any, index: number) => (
                  <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-purple-600">{code.code}</span>
                      <span className="text-sm text-gray-500">
                        {code.points} pts (KES {(code.points / 10).toFixed(2)})
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{code.description}</p>
                    <div className="text-xs text-gray-500">
                      Used: {code.used_count}/{code.usage_limit || '∞'} | 
                      Status: {code.is_active ? 'Active' : 'Inactive'}
                    </div>
                    <button
                      onClick={() => setTestCode(code.code)}
                      className="mt-2 text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      Use This Code
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default TestLuckyCodes;