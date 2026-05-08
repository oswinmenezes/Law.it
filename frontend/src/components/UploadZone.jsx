import { useRef, useState, useCallback } from 'react';
import { getPromptOptions } from '../api/ocr';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';

/**
 * PDF.js Worker Configuration
 * Using unpkg CDN to ensure the worker matches the exact version and avoids bundling issues.
 */
const PDFJS_VERSION = '5.6.205';
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/bmp', 'application/pdf'];
const MAX_SIZE_MB = 15;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export default function UploadZone({
  onImageSelect,
  imagePreview,
  imageInfo,
  onClear,
  onScan,
  isLoading,
  hasApiKey,
  promptKey,
  onPromptChange,
}) {
  const [dragover, setDragover] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const inputRef = useRef(null);

  const convertPdfToImages = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      const pageImages = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport }).promise;
        pageImages.push(canvas.toDataURL('image/png'));
      }
      return pageImages;
    } catch (err) {
      console.error('PDF conversion error:', err);
      throw new Error('Failed to process PDF file');
    }
  };

  const processFile = useCallback(
    async (file) => {
      if (!file) return;

      if (!ACCEPTED_TYPES.includes(file.type)) {
        onImageSelect(null, null, `Unsupported file type: ${file.type}. Use Images or PDF.`);
        return;
      }

      if (file.size > MAX_SIZE_BYTES) {
        onImageSelect(null, null, `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max ${MAX_SIZE_MB} MB.`);
        return;
      }

      if (file.type === 'application/pdf') {
        setIsProcessingPdf(true);
        try {
          const pageImages = await convertPdfToImages(file);
          const dataUrl = pageImages[0]; // First page for preview
          const base64 = dataUrl.split(',')[1];
          onImageSelect(base64, {
            name: file.name,
            size: file.size,
            type: file.type,
            dataUrl,
            pages: pageImages, // Store all pages
          });
        } catch (err) {
          onImageSelect(null, null, err.message);
        } finally {
          setIsProcessingPdf(false);
        }
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target.result;
          const base64 = dataUrl.split(',')[1];
          onImageSelect(base64, {
            name: file.name,
            size: file.size,
            type: file.type,
            dataUrl,
          });
        };
        reader.readAsDataURL(file);
      }
    },
    [onImageSelect]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragover(false);
      const file = e.dataTransfer.files[0];
      processFile(file);
    },
    [processFile]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragover(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragover(false);
  }, []);

  const handlePaste = useCallback(
    (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          processFile(item.getAsFile());
          return;
        }
      }
    },
    [processFile]
  );

  const handleInputChange = useCallback(
    (e) => {
      processFile(e.target.files[0]);
      e.target.value = '';
    },
    [processFile]
  );

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const promptOptions = getPromptOptions();

  return (
    <section className="upload-card">
      {!imagePreview ? (
        <div
          className={`upload-zone ${dragover ? 'dragover' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onPaste={handlePaste}
          id="upload-zone"
        >
          <div className="upload-icon" style={{ margin: '0 auto 20px', display: 'flex', justifyContent: 'center' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          </div>
          <h2>Upload Document</h2>
          <p>Drop a PDF or image here, or click to browse</p>
          <p style={{ marginTop: '12px', fontSize: '12px', opacity: 0.7 }}>
            Supports PDF, PNG, JPG (Max {MAX_SIZE_MB}MB)
          </p>
        </div>
      ) : (
        <div className="image-preview-container">
          <img
            src={imageInfo.dataUrl}
            alt="Uploaded preview"
            className="image-preview"
          />
          <div className="image-info">
            <span className="image-info-badge">{imageInfo.name}</span>
            <span className="image-info-badge">{formatSize(imageInfo.size)}</span>
            <span className="image-info-badge">{imageInfo.type.split('/')[1].toUpperCase()}</span>
            {imageInfo.pages && (
              <span className="image-info-badge">{imageInfo.pages.length} Pages</span>
            )}
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-secondary)' }}>
              EXTRACTION MODE
            </label>
            <select
              style={{
                width: '100%',
                height: '44px',
                padding: '0 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-medium)',
                background: 'var(--bg-sidebar)',
                fontSize: '14px',
                fontWeight: '500'
              }}
              value={promptKey}
              onChange={(e) => onPromptChange(e.target.value)}
            >
              {promptOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="btn-primary"
              onClick={onScan}
              disabled={isLoading || isProcessingPdf || !hasApiKey}
              style={{ flex: 1 }}
            >
              {isLoading || isProcessingPdf ? (
                <>
                  <span className="loading-spinner" />
                  {isProcessingPdf ? 'Rendering...' : 'Analysing...'}
                </>
              ) : (
                'Process Document'
              )}
            </button>
            <button className="btn-secondary" onClick={onClear} disabled={isLoading}>
              Clear
            </button>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        style={{ display: 'none' }}
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleInputChange}
      />
    </section>
  );
}
