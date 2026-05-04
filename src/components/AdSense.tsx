import { useEffect } from 'react';
import './AdSense.css';

interface AdSenseProps {
  adSlot: string;
  adFormat?: string;
  style?: React.CSSProperties;
  className?: string;
}

export const AdSense = ({ 
  adSlot, 
  adFormat = "auto", 
  style = { display: 'block' },
  className = ""
}: AdSenseProps) => {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  return (
    <div className={`adsense-container ${className}`}>
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client="ca-pub-7825089072589278"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  );
};

// Pre-configured ad components for common placements
export const BannerAd = ({ className = "" }: { className?: string }) => (
  <AdSense 
    adSlot="1234567890" // Replace with your actual ad slot ID
    adFormat="horizontal"
    className={`banner-ad ${className}`}
    style={{ display: 'block', width: '100%', height: '90px' }}
  />
);

export const SquareAd = ({ className = "" }: { className?: string }) => (
  <AdSense 
    adSlot="0987654321" // Replace with your actual ad slot ID
    adFormat="rectangle"
    className={`square-ad ${className}`}
    style={{ display: 'block', width: '300px', height: '250px' }}
  />
);

export const ResponsiveAd = ({ className = "" }: { className?: string }) => (
  <AdSense 
    adSlot="1122334455" // Replace with your actual ad slot ID
    className={`responsive-ad ${className}`}
  />
);