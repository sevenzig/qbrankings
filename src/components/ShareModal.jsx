import React, { useState, useCallback } from 'react';

const ShareModal = ({ isOpen, onClose, screenshotUrl, shareLink, shareType }) => {
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Debug logging
  console.log('📸 ShareModal props:', { isOpen, screenshotUrl, shareLink, shareType });
  
  // Test blob URL validity
  React.useEffect(() => {
    if (screenshotUrl) {
      console.log('📸 Testing blob URL validity:', screenshotUrl);
      fetch(screenshotUrl)
        .then(response => {
          console.log('📸 Blob URL fetch response:', response.status, response.type);
          return response.blob();
        })
        .then(blob => {
          console.log('📸 Blob details:', blob.size, 'bytes, type:', blob.type);
        })
        .catch(error => {
          console.error('📸 Blob URL test failed:', error);
        });
    }
  }, [screenshotUrl]);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Fallback: select the text
      const textField = document.getElementById('share-link-text');
      if (textField) {
        textField.select();
        textField.setSelectionRange(0, 99999); // For mobile devices
      }
    }
  }, [shareLink]);

  const downloadScreenshot = useCallback(() => {
    if (screenshotUrl) {
      const link = document.createElement('a');
      link.href = screenshotUrl;
      const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '');
      link.download = `qb-rankings-top10-${timestamp}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [screenshotUrl]);

  const copyImageToClipboard = useCallback(async () => {
    if (screenshotUrl) {
      try {
        const response = await fetch(screenshotUrl);
        const blob = await response.blob();
        
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({
              [blob.type]: blob
            })
          ]);
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        } else {
          // Fallback: copy the blob URL
          await navigator.clipboard.writeText(screenshotUrl);
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        }
      } catch (err) {
        console.error('Failed to copy image:', err);
        // Fallback: copy the blob URL
        try {
          await navigator.clipboard.writeText(screenshotUrl);
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        } catch (fallbackErr) {
          console.error('Failed to copy URL fallback:', fallbackErr);
        }
      }
    }
  }, [screenshotUrl]);

  const openFullSize = useCallback(() => {
    if (screenshotUrl) {
      window.open(screenshotUrl, '_blank');
    }
  }, [screenshotUrl]);

  const shareToTwitter = useCallback(() => {
    const text = `Check out my QB rankings! ${shareType === 'quick' ? '🚀 Quick view' : '📊 Full analysis'} of the top 10 quarterbacks.`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareLink)}`;
    window.open(url, '_blank', 'width=550,height=420');
  }, [shareLink, shareType]);

  const shareToBluesky = useCallback(() => {
    const text = `Check out my QB rankings! ${shareType === 'quick' ? '🚀 Quick view' : '📊 Full analysis'} of the top 10 quarterbacks.\n\n${shareLink}`;
    const url = `https://bsky.app/intent/compose?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }, [shareLink, shareType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 rounded-2xl border border-blue-400/30 shadow-2xl max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-blue-400/30">
          <div>
            <h2 className="text-2xl font-bold text-white">📸 QB Rankings Shared!</h2>
            <p className="text-blue-200 text-sm mt-1">
              {shareType === 'quick' ? '🚀 Quick Share' : '📊 Full Detail Share'} - Link copied to clipboard
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-200 transition-colors p-2 hover:bg-white/10 rounded-lg"
            title="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - Two Column Layout on Desktop */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Left Column - Screenshot */}
            <div className="order-1">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">📱 Preview</h3>
                <div className="bg-white/5 rounded-xl p-4 border border-blue-400/20">
                  {screenshotUrl ? (
                    <div>
                      <div className="text-xs text-gray-400 mb-2">Debug: {screenshotUrl}</div>
                      <img 
                        src={screenshotUrl} 
                        alt="QB Rankings Screenshot" 
                        className="w-full h-auto rounded-lg shadow-lg border border-blue-400/30"
                        style={{ maxHeight: '500px', objectFit: 'contain' }}
                        onLoad={(e) => {
                          console.log('📸 Image loaded successfully');
                          console.log('📸 Image dimensions:', e.target.naturalWidth, 'x', e.target.naturalHeight);
                          console.log('📸 Image display dimensions:', e.target.offsetWidth, 'x', e.target.offsetHeight);
                        }}
                        onError={(e) => {
                          console.error('📸 Image failed to load:', e);
                          console.error('📸 Error details:', e.target.src);
                          console.log('📸 Trying data URL fallback...');
                          // Try data URL fallback if blob URL fails
                          if (window.screenshotDataUrl) {
                            e.target.src = window.screenshotDataUrl;
                            console.log('📸 Switched to data URL fallback');
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-600">
                      <div className="text-center text-gray-400">
                        <div className="text-4xl mb-2">📸</div>
                        <div className="text-sm">Screenshot not available</div>
                        <div className="text-xs mt-1">Preview will appear here</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Screenshot Options - Mobile Layout (stacked buttons) */}
                  {screenshotUrl && (
                    <div className="mt-3 flex flex-wrap gap-2 lg:hidden">
                      <button
                        onClick={downloadScreenshot}
                        className="bg-green-500/20 hover:bg-green-500/30 px-3 py-2 rounded-lg font-medium transition-colors text-green-200 hover:text-white text-sm"
                      >
                        💾 Download
                      </button>
                      <button
                        onClick={copyImageToClipboard}
                        className="bg-blue-500/20 hover:bg-blue-500/30 px-3 py-2 rounded-lg font-medium transition-colors text-blue-200 hover:text-white text-sm"
                      >
                        📋 Copy Image
                      </button>
                      <button
                        onClick={openFullSize}
                        className="bg-purple-500/20 hover:bg-purple-500/30 px-3 py-2 rounded-lg font-medium transition-colors text-purple-200 hover:text-white text-sm"
                      >
                        🔍 View Full Size
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Share Options */}
            <div className="order-2 space-y-6">
              {/* Screenshot Options - Desktop Layout (full width buttons) */}
              {screenshotUrl && (
                <div className="hidden lg:block">
                  <h3 className="text-lg font-semibold text-white mb-3">🛠️ Screenshot Options</h3>
                  <div className="bg-white/5 rounded-xl p-4 border border-blue-400/20 space-y-3">
                    <button
                      onClick={downloadScreenshot}
                      className="w-full flex items-center gap-3 bg-green-500/20 hover:bg-green-500/30 px-4 py-3 rounded-lg font-medium transition-colors text-green-200 hover:text-white text-sm"
                    >
                      <span className="text-lg">💾</span>
                      <div className="text-left">
                        <div className="font-semibold">Download Image</div>
                        <div className="text-green-300 text-xs">Save screenshot to your device</div>
                      </div>
                    </button>
                    <button
                      onClick={copyImageToClipboard}
                      className="w-full flex items-center gap-3 bg-blue-500/20 hover:bg-blue-500/30 px-4 py-3 rounded-lg font-medium transition-colors text-blue-200 hover:text-white text-sm"
                    >
                      <span className="text-lg">📋</span>
                      <div className="text-left">
                        <div className="font-semibold">Copy to Clipboard</div>
                        <div className="text-blue-300 text-xs">Copy image for pasting elsewhere</div>
                      </div>
                    </button>
                    <button
                      onClick={openFullSize}
                      className="w-full flex items-center gap-3 bg-purple-500/20 hover:bg-purple-500/30 px-4 py-3 rounded-lg font-medium transition-colors text-purple-200 hover:text-white text-sm"
                    >
                      <span className="text-lg">🔍</span>
                      <div className="text-left">
                        <div className="font-semibold">View Full Size</div>
                        <div className="text-purple-300 text-xs">Open image in new tab</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Share Link */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">🔗 Share Link</h3>
                <div className="bg-white/5 rounded-xl p-4 border border-blue-400/20">
                  <div className="flex gap-2">
                    <input
                      id="share-link-text"
                      type="text"
                      value={shareLink}
                      readOnly
                      className="flex-1 bg-white/10 border border-blue-400/30 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400/50 selection:bg-blue-400/30"
                      onClick={(e) => e.target.select()}
                    />
                    <button
                      onClick={copyToClipboard}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                        copySuccess 
                          ? 'bg-green-500/20 text-green-200' 
                          : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 hover:text-white'
                      }`}
                    >
                      {copySuccess ? '✅ Copied!' : '📋 Copy'}
                    </button>
                  </div>
                  <p className="text-blue-300 text-xs mt-2">
                    {shareType === 'quick' 
                      ? '🚀 Compact URL with main weights only' 
                      : '📊 Detailed URL with all sub-component weights'
                    }
                  </p>
                </div>
              </div>

              {/* Social Sharing */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">🚀 Share Socially</h3>
                <div className="bg-white/5 rounded-xl p-4 border border-blue-400/20">
                  <div className="space-y-3">
                    <button
                      onClick={shareToTwitter}
                      className="w-full flex items-center gap-3 bg-blue-500/20 hover:bg-blue-500/30 px-4 py-3 rounded-lg font-medium transition-colors text-blue-200 hover:text-white text-sm"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      <div className="text-left">
                        <div className="font-semibold">Share on X (Twitter)</div>
                        <div className="text-blue-300 text-xs">Post with rankings screenshot</div>
                      </div>
                    </button>
                    <button
                      onClick={shareToBluesky}
                      className="w-full flex items-center gap-3 bg-sky-500/20 hover:bg-sky-500/30 px-4 py-3 rounded-lg font-medium transition-colors text-sky-200 hover:text-white text-sm"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5.2 7.5c-1.1 1.1-2.9 1.1-4 0L12 8.3l-1.2 1.2c-1.1 1.1-2.9 1.1-4 0-.6-.6-.6-1.5 0-2.1l2.8-2.8c1.2-1.2 3.1-1.2 4.3 0l2.8 2.8c.6.6.6 1.5 0 2.1z"/>
                      </svg>
                      <div className="text-left">
                        <div className="font-semibold">Share on Bluesky</div>
                        <div className="text-sky-300 text-xs">Post with rankings screenshot</div>
                      </div>
                    </button>
                  </div>
                  <p className="text-blue-300 text-xs mt-3">
                    Share your QB philosophy and rankings with the world! Links include your custom weights and screenshot.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-blue-400/30 bg-blue-900/50">
          <div className="flex flex-wrap justify-center gap-3 text-sm text-blue-200">
            <span>📱 Screenshot created</span>
            <span>•</span>
            <span>🔗 Link ready to share</span>
            <span>•</span>
            <span>⚡ Your QB philosophy preserved</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal; 