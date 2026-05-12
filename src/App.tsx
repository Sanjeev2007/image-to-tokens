import { useState, useCallback, useEffect } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Settings, Upload } from 'lucide-react';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
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

      <main className="max-w-2xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
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
                Drop an image here, or click to browse
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
