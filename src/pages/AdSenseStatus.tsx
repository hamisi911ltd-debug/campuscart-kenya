import { useEffect, useState } from 'react';

const AdSenseStatus = () => {
  const [adSenseLoaded, setAdSenseLoaded] = useState(false);
  const [pageInfo, setPageInfo] = useState({
    url: '',
    userAgent: '',
    timestamp: ''
  });

  useEffect(() => {
    // Check if AdSense script loaded
    const checkAdSense = () => {
      if (window.adsbygoogle) {
        setAdSenseLoaded(true);
      }
    };

    // Set page info
    setPageInfo({
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });

    checkAdSense();
    
    // Check again after a delay
    const timer = setTimeout(checkAdSense, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
            🎯 Google AdSense Verification Status
          </h1>
          
          {/* AdSense Status */}
          <div className={`p-6 rounded-lg border-2 mb-8 ${
            adSenseLoaded ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${
                adSenseLoaded ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <h2 className={`text-xl font-bold ${
                adSenseLoaded ? 'text-green-800' : 'text-red-800'
              }`}>
                AdSense Script Status: {adSenseLoaded ? '✅ LOADED' : '❌ NOT LOADED'}
              </h2>
            </div>
            <p className={`mt-2 ${
              adSenseLoaded ? 'text-green-700' : 'text-red-700'
            }`}>
              {adSenseLoaded 
                ? 'Google AdSense scripts are properly loaded and ready for verification.'
                : 'AdSense scripts are not detected. This may affect verification.'}
            </p>
          </div>

          {/* Site Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="font-bold text-blue-900 mb-3">📊 Site Information</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Publisher ID:</strong> ca-pub-7825089072589278</div>
                <div><strong>Domain:</strong> campusmart.co.ke</div>
                <div><strong>Current URL:</strong> {pageInfo.url}</div>
                <div><strong>Timestamp:</strong> {pageInfo.timestamp}</div>
              </div>
            </div>

            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
              <h3 className="font-bold text-purple-900 mb-3">🔗 Verification Files</h3>
              <div className="space-y-2 text-sm">
                <div>✅ <strong>ads.txt:</strong> /ads.txt</div>
                <div>✅ <strong>Meta tag:</strong> In &lt;head&gt;</div>
                <div>✅ <strong>Script tag:</strong> AdSense JS</div>
                <div>✅ <strong>Robots.txt:</strong> Allows crawling</div>
              </div>
            </div>
          </div>

          {/* Verification Links */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
            <h3 className="font-bold text-gray-900 mb-4">🔍 Verification Resources</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a 
                href="/ads.txt" 
                target="_blank"
                className="flex items-center gap-2 p-3 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                <span>📄</span>
                <span>View ads.txt file</span>
              </a>
              <a 
                href="/google-adsense-verification.html" 
                target="_blank"
                className="flex items-center gap-2 p-3 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                <span>🔗</span>
                <span>AdSense verification page</span>
              </a>
              <a 
                href="/robots.txt" 
                target="_blank"
                className="flex items-center gap-2 p-3 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                <span>🤖</span>
                <span>View robots.txt</span>
              </a>
              <a 
                href="/sitemap.xml" 
                target="_blank"
                className="flex items-center gap-2 p-3 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                <span>🗺️</span>
                <span>View sitemap.xml</span>
              </a>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
            <h3 className="font-bold text-yellow-900 mb-3">📋 Next Steps for AdSense Verification</h3>
            <ol className="list-decimal list-inside space-y-2 text-yellow-800 text-sm">
              <li>Ensure this page loads properly at: <code>https://campusmart.co.ke/adsense-status</code></li>
              <li>Verify all links above work correctly</li>
              <li>Wait 24-48 hours for Google to re-crawl your site</li>
              <li>Try the AdSense verification process again</li>
              <li>If still failing, use the HTML file upload method in AdSense</li>
            </ol>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-8">
            <a 
              href="/" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>🏠</span>
              <span>Back to CampusMart</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdSenseStatus;