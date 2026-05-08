import { useState, useEffect } from "react";
import { Gift, Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { localLuckyCodesService } from "@/utils/luckyCodesLocal";

interface LuckyCode {
  id: string;
  code: string;
  points: number;
  description: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
}

export const LuckyCodeTestPanel = () => {
  const [codes, setCodes] = useState<LuckyCode[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    loadCodes();
  }, []);

  const loadCodes = async () => {
    try {
      const availableCodes = await localLuckyCodesService.getAvailableCodes();
      setCodes(availableCodes);
    } catch (error) {
      console.error('Error loading codes:', error);
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success(`Copied ${code} to clipboard!`);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy code');
    }
  };

  const resetCodes = () => {
    localLuckyCodesService.reset();
    loadCodes();
    toast.success('Lucky codes reset!');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Gift className="h-5 w-5 text-purple-500" />
          Test Lucky Codes
        </h2>
        <button
          onClick={resetCodes}
          className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Reset
        </button>
      </div>

      <div className="space-y-3">
        {codes.map((code) => (
          <div
            key={code.id}
            className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                  {code.code}
                </span>
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                  {code.points} pts (KES {(code.points / 10).toFixed(2)})
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {code.description}
              </p>
              <div className="text-xs text-gray-500">
                Used: {code.usedCount}/{code.usageLimit || '∞'}
              </div>
            </div>
            
            <button
              onClick={() => copyCode(code.code)}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
            >
              {copiedCode === code.code ? (
                <>
                  <CheckCircle className="h-3 w-3" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          How to test:
        </h3>
        <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>1. Copy any code above</li>
          <li>2. Open the Lucky Code modal (click the gift icon)</li>
          <li>3. Paste and redeem the code</li>
          <li>4. Check your wallet balance increase</li>
        </ol>
      </div>
    </div>
  );
};