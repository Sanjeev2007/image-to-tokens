import { useState, useCallback, useEffect } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Settings, Upload } from 'lucide-react';
import { extractColors } from './lib/extractColors';
import { assignRoles, SemanticColor } from './lib/assignRoles';
import { generateTokensCss } from './lib/generateTokensCss';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [semanticColors, setSemanticColors] = useState<SemanticColor[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [copied, setCopied] = useState<'idle' | 'copied' | 'error'>('idle');

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

  const tokensCssOutput = semanticColors.length > 0 ? generateTokensCss(semanticColors) : '';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="font-semibold text-gray-900">Image to Design Tokens</h1>
        <button
          aria-label="Settings"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          <Settings size={20} />
        </button>
      </header>

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
                <div className="flex flex-wrap justify-center gap-4 max-w-2xl mx-auto mb-12">
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
                  <h3 className="text-sm font-mono text-gray-700 mb-2">tokens.css</h3>
                  <div className="relative bg-gray-900 rounded-lg p-6 overflow-hidden">
                    <button
                      onClick={() => handleCopy(tokensCssOutput)}
                      className="absolute top-4 right-4 px-3 py-1 text-xs font-medium rounded bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors"
                    >
                      {copied === 'copied' ? 'Copied!' : copied === 'error' ? 'Failed' : 'Copy'}
                    </button>
                    <pre className="text-gray-100 font-mono text-sm overflow-x-auto">
                      <code>{tokensCssOutput}</code>
                    </pre>
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
