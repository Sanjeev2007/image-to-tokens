import { useState, useCallback, useEffect } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Upload, ExternalLink } from 'lucide-react';
import { extractColors } from './lib/extractColors';
import { assignRoles, SemanticColor } from './lib/assignRoles';
import { generateTokensCss } from './lib/generateTokensCss';
import { generateTailwindConfig } from './lib/generateTailwindConfig';
import { generateTokensJson } from './lib/generateTokensJson';
import { downloadZip } from './lib/downloadZip';

type TabId = 'css' | 'tailwind' | 'json' | 'zip';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [semanticColors, setSemanticColors] = useState<SemanticColor[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [copied, setCopied] = useState<'idle' | 'copied' | 'error'>('idle');
  
  const [activeTab, setActiveTab] = useState<TabId>('css');

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

  const tabs: { id: TabId; label: string }[] = [
    { id: 'css', label: 'tokens.css' },
    { id: 'tailwind', label: 'tailwind.config.js' },
    { id: 'json', label: 'tokens.json' },
    { id: 'zip', label: 'Download ZIP' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-40">
        <h1 className="font-semibold text-gray-900">Image to Design Tokens</h1>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="mb-10">
          <h2 className="text-4xl font-bold text-gray-900 mb-3">
            Drop an image. Get production-ready design tokens.
          </h2>
          <p className="text-gray-600 max-w-lg mx-auto">
            Free CSS, Tailwind config, Style Dictionary JSON, and a ZIP bundle. Heuristic v1 — AI version coming soon.
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
                            downloadZip(semanticColors);
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
                      </button>
                    ))}
                  </div>

                  <div className="relative bg-gray-900 rounded-lg overflow-hidden min-h-[300px]">
                    <div className="p-6 h-full overflow-y-auto">
                      <button
                        onClick={() => handleCopy(getActiveTabContent())}
                        className="absolute top-4 right-4 px-3 py-1.5 text-xs font-medium rounded bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors"
                      >
                        {copied === 'copied' ? 'Copied!' : copied === 'error' ? 'Failed' : 'Copy'}
                      </button>
                      <pre className="text-gray-100 font-mono text-sm text-left">
                        <code>{getActiveTabContent()}</code>
                      </pre>
                    </div>
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
      
      <footer className="border-t border-gray-200 bg-white py-6 mt-auto">
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            Like it? Support the build — 
            <a 
              href="https://sanjeevsky3.gumroad.com/l/image-to-tokens" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-900 font-medium hover:text-blue-600 inline-flex items-center gap-1 transition-colors"
            >
              Buy me a coffee <ExternalLink size={14} />
            </a>
          </span>
          <span className="hidden sm:inline text-gray-300">|</span>
          <span>heuristic v1 — AI vision coming soon</span>
          <span className="hidden sm:inline text-gray-300">|</span>
          <a href="https://github.com/sanjeevsky3/image-to-tokens" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">
            View source on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;
