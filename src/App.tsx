import { useState, useCallback, useEffect } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Settings, Upload, Lock, ExternalLink, X } from 'lucide-react';
import { extractColors } from './lib/extractColors';
import { assignRoles, SemanticColor } from './lib/assignRoles';
import { generateTokensCss } from './lib/generateTokensCss';
import { generateTailwindConfig } from './lib/generateTailwindConfig';
import { generateTokensJson } from './lib/generateTokensJson';
import { downloadZip } from './lib/downloadZip';
import { verifyLicense } from './lib/verifyLicense';

type TabId = 'css' | 'tailwind' | 'json' | 'zip';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [semanticColors, setSemanticColors] = useState<SemanticColor[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [copied, setCopied] = useState<'idle' | 'copied' | 'error'>('idle');
  
  const [activeTab, setActiveTab] = useState<TabId>('css');
  const [isPaid, setIsPaid] = useState<boolean>(false);

  // Settings modal state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [licenseInput, setLicenseInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [licenseError, setLicenseError] = useState<string | null>(null);

  useEffect(() => {
    const checkLicense = async () => {
      const savedKey = localStorage.getItem('imgtokens.license');
      if (savedKey) {
        const result = await verifyLicense(savedKey);
        if (result.success) {
          setIsPaid(true);
        } else {
          localStorage.removeItem('imgtokens.license');
          setIsPaid(false);
        }
      }
    };
    checkLicense();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSettingsOpen) {
        setIsSettingsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen]);

  const handleVerify = async () => {
    if (!licenseInput.trim()) return;
    setIsVerifying(true);
    setLicenseError(null);
    const result = await verifyLicense(licenseInput.trim());
    setIsVerifying(false);
    
    if (result.success) {
      localStorage.setItem('imgtokens.license', licenseInput.trim());
      setIsPaid(true);
      setLicenseInput('');
      if (activeTab === 'zip') {
        setActiveTab('css');
      }
    } else {
      setLicenseError(result.message || 'Verification failed');
    }
  };

  const handleRemoveLicense = () => {
    localStorage.removeItem('imgtokens.license');
    setIsPaid(false);
    setLicenseInput('');
    setLicenseError(null);
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied('copied');
      setTimeout(() => setCopied('idle'), 1500);
    } catch (e) {
      setCopied('error');
      setTimeout(() => setCopied('idle'), 1500);
    }
  };

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const pastedFile = items[i].getAsFile();
          if (pastedFile) {
            setError(null);
            setFile(pastedFile);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  useEffect(() => {
    if (!file) {
      setSemanticColors([]);
      return;
    }
    
    let isMounted = true;
    
    const extract = async () => {
      setIsExtracting(true);
      try {
        const result = await extractColors(file);
        if (isMounted) {
          setSemanticColors(assignRoles(result));
        }
      } catch (err) {
        if (isMounted) {
          setError('Could not extract colors from this image.');
          setSemanticColors([]);
        }
      } finally {
        if (isMounted) {
          setIsExtracting(false);
        }
      }
    };
    
    extract();
    
    return () => {
      isMounted = false;
    };
  }, [file]);

  const onDrop = useCallback((accepted: File[], rejected: FileRejection[]) => {
    if (rejected.length > 0) {
      setError('Please drop a single PNG, JPG, or WebP image.');
      return;
    }
    setError(null);
    setFile(accepted[0] ?? null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': [],
      'image/jpeg': [],
      'image/webp': [],
    },
    maxFiles: 1,
  });

  const getActiveTabContent = () => {
    if (semanticColors.length === 0) return '';
    if (activeTab === 'css') return generateTokensCss(semanticColors);
    if (activeTab === 'tailwind') return generateTailwindConfig(semanticColors);
    if (activeTab === 'json') return generateTokensJson(semanticColors);
    return '/* ZIP bundle includes tokens.css, tailwind.config.js, tokens.json, and a README.md */';
  };

  const tabs: { id: TabId; label: string; pro: boolean }[] = [
    { id: 'css', label: 'tokens.css', pro: false },
    { id: 'tailwind', label: 'tailwind.config.js', pro: true },
    { id: 'json', label: 'tokens.json', pro: true },
    { id: 'zip', label: 'Download ZIP', pro: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-40">
        <h1 className="font-semibold text-gray-900">Image to Design Tokens</h1>
        <button
          onClick={() => setIsSettingsOpen(true)}
          aria-label="Settings"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <Settings size={20} />
        </button>
      </header>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="absolute inset-0" onClick={() => setIsSettingsOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => setIsSettingsOpen(false)}
            >
              <X size={20} />
            </button>
            
            <h2 className="text-xl font-bold text-gray-900 mb-6">Settings</h2>
            
            {isPaid ? (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">License active</h3>
                <div className="bg-gray-100 px-3 py-2 rounded text-sm font-mono text-gray-600 mb-4">
                  ••••-••••-XXXX
                </div>
                <button 
                  onClick={handleRemoveLicense}
                  className="text-sm text-red-500 hover:text-red-600 font-medium transition-colors"
                >
                  Remove license
                </button>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">License key</label>
                <input 
                  type="text" 
                  value={licenseInput}
                  onChange={e => setLicenseInput(e.target.value)}
                  placeholder="XXXXXXXX-XXXXXXXX-..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {licenseError && (
                  <p className="text-xs text-red-500 mb-3">{licenseError}</p>
                )}
                <button 
                  onClick={handleVerify}
                  disabled={isVerifying || !licenseInput.trim()}
                  className="w-full bg-gray-900 text-white font-medium py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {isVerifying ? 'Verifying…' : 'Verify'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <main className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="mb-10">
          <h2 className="text-4xl font-bold text-gray-900 mb-3">
            Drop an image. Get production-ready design tokens.
          </h2>
          <p className="text-gray-600">
            Free CSS export. $5 lifetime unlocks Tailwind config, JSON, and ZIP.
          </p>
        </div>

        {file && previewUrl ? (
          <div className="flex flex-col items-center gap-4">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-md w-full rounded-lg shadow-sm"
            />
            <button
              onClick={() => {
                setFile(null);
                setError(null);
              }}
              className="text-sm text-red-500 underline"
            >
              Remove
            </button>

            {isExtracting ? (
              <p className="text-gray-500 italic text-sm">Extracting colors…</p>
            ) : semanticColors.length > 0 ? (
              <div className="w-full mt-6">
                <div className="flex flex-wrap justify-center gap-4 max-w-2xl mx-auto mb-10">
                  {semanticColors.map((sc, i) => (
                    <div key={`${sc.hex}-${i}`} className="flex flex-col items-center gap-1">
                      <span className="text-xs font-medium text-gray-700 lowercase mb-1">{sc.role}</span>
                      <div
                        className="w-16 h-16 rounded-lg border border-gray-200 shadow-sm"
                        style={{ backgroundColor: sc.hex }}
                        aria-label={sc.hex}
                      />
                      <span className="text-xs font-mono text-gray-600 mt-1">{sc.hex}</span>
                    </div>
                  ))}
                </div>
                
                <div className="max-w-2xl mx-auto text-left">
                  <div className="flex overflow-x-auto border-b border-gray-200 mb-4 no-scrollbar">
                    {tabs.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          if (tab.id === 'zip') {
                            if (isPaid) {
                              downloadZip(semanticColors);
                            } else {
                              setActiveTab('zip');
                            }
                            return;
                          }
                          setActiveTab(tab.id);
                        }}
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                          activeTab === tab.id 
                            ? 'border-gray-900 text-gray-900' 
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {tab.label}
                        {tab.pro && !isPaid && <Lock size={14} className="text-gray-400" />}
                      </button>
                    ))}
                  </div>

                  <div className="relative bg-gray-900 rounded-lg overflow-hidden min-h-[300px]">
                    {activeTab !== 'css' && !isPaid ? (
                      <>
                        <div className="absolute inset-0 blur-[3px] opacity-40 p-6 pointer-events-none select-none">
                          <pre className="text-gray-100 font-mono text-sm overflow-hidden">
                             <code>{getActiveTabContent()}</code>
                          </pre>
                        </div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/60 z-10 px-4">
                          <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full text-center">
                            <div className="mx-auto bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                              <Lock className="text-gray-600" size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Unlock with $5 lifetime</h3>
                            <p className="text-sm text-gray-600 mb-6">Tailwind config, JSON, and ZIP — pay once, use forever</p>
                            <a 
                              href="https://gumroad.com/l/image-to-tokens" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors w-full"
                            >
                              Buy on Gumroad <ExternalLink size={16} />
                            </a>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="p-6 h-full overflow-y-auto">
                        <button
                          onClick={() => handleCopy(getActiveTabContent())}
                          className="absolute top-4 right-4 px-3 py-1.5 text-xs font-medium rounded bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors"
                        >
                          {copied === 'copied' ? 'Copied!' : copied === 'error' ? 'Failed' : 'Copy'}
                        </button>
                        <pre className="text-gray-100 font-mono text-sm">
                          <code>{getActiveTabContent()}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400 bg-white'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto text-gray-400 mb-3" size={36} />
              <p className="text-gray-600">
                Drop an image, click to browse, or paste from clipboard
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PNG, JPG, or WebP — one image at a time
              </p>
            </div>
            {error && (
              <p className="text-red-500 text-sm text-center mt-3">{error}</p>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
