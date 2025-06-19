import React, { useState } from 'react';
import { Button } from '@/components/ui/buttons/Button';
import { Globe, Plus, Eye, Download, Loader2 } from 'lucide-react';

const typography = {
  h1: { fontSize: '32px', fontWeight: '700', lineHeight: '1.2' },
  h2: { fontSize: '24px', fontWeight: '600', lineHeight: '1.3' },
  h3: { fontSize: '20px', fontWeight: '600', lineHeight: '1.4' },
  body1R: { fontSize: '16px', fontWeight: '400', lineHeight: '1.5' },
  body1B: { fontSize: '16px', fontWeight: '600', lineHeight: '1.5' },
  body2: { fontSize: '14px', fontWeight: '400', lineHeight: '1.4' }
};

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  // Simple toast implementation
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 9999;
    padding: 12px 24px; border-radius: 8px; color: white;
    background: ${type === 'success' ? '#059669' : '#DC2626'};
    font-size: 14px; max-width: 400px;
  `;
  document.body.appendChild(toast);
  setTimeout(() => document.body.removeChild(toast), 3000);
};

interface WinePreview {
  name: string;
  year: number;
  description?: string;
  varietal?: string;
  region?: string;
  ratings?: {
    vn?: number;
    jd?: number;
    ws?: number;
    abv?: number;
  };
}

interface WineryPreview {
  name: string;
  description?: string;
  location?: string;
  established?: number;
  website?: string;
  wineCount: number;
  wines: WinePreview[];
}

const WineryImport: React.FC = () => {
  const [url, setUrl] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [additionalPaths, setAdditionalPaths] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<WineryPreview | null>(null);
  const [importResult, setImportResult] = useState<{ tenantId: number; winesCreated: number } | null>(null);

  const addAdditionalPath = () => {
    setAdditionalPaths([...additionalPaths, '']);
  };

  const updateAdditionalPath = (index: number, value: string) => {
    const updated = [...additionalPaths];
    updated[index] = value;
    setAdditionalPaths(updated);
  };

  const removeAdditionalPath = (index: number) => {
    setAdditionalPaths(additionalPaths.filter((_, i) => i !== index));
  };

  const handlePreview = async () => {
    if (!url) {
      showToast('Please enter a winery URL', 'error');
      return;
    }

    setPreviewing(true);
    setPreview(null);

    try {
      const response = await fetch('/api/preview-winery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          additionalPaths: additionalPaths.filter(path => path.trim())
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to preview winery');
      }

      setPreview(result.winery);
      showToast(`Preview loaded: ${result.winery.name} with ${result.winery.wineCount} wines`);

    } catch (error) {
      console.error('Preview error:', error);
      showToast(error instanceof Error ? error.message : 'Failed to preview winery', 'error');
    } finally {
      setPreviewing(false);
    }
  };

  const handleImport = async () => {
    if (!url) {
      showToast('Please enter a winery URL', 'error');
      return;
    }

    setLoading(true);
    setImportResult(null);

    try {
      const response = await fetch('/api/parse-winery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          tenantSlug: tenantSlug.trim() || undefined,
          additionalPaths: additionalPaths.filter(path => path.trim())
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to import winery');
      }

      setImportResult({
        tenantId: result.tenantId,
        winesCreated: result.winesCreated
      });

      showToast(result.message);

      // Reset form
      setUrl('');
      setTenantSlug('');
      setAdditionalPaths(['']);
      setPreview(null);

    } catch (error) {
      console.error('Import error:', error);
      showToast(error instanceof Error ? error.message : 'Failed to import winery', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 style={typography.h1} className="mb-2">Import Winery Data</h1>
          <p style={typography.body1R} className="text-white/60">
            Automatically parse winery websites and import wine collections using AI-powered data extraction
          </p>
        </div>

        {/* Import Form */}
        <div className="bg-white/5 rounded-lg p-6 mb-8">
          <h2 style={typography.h2} className="mb-6 flex items-center gap-2">
            <Globe size={24} />
            Winery Website Parser
          </h2>

          {/* Main URL */}
          <div className="mb-4">
            <label style={typography.body1R} className="block mb-2">Winery Website URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full p-3 bg-white/5 border border-white/20 rounded-lg"
              placeholder="https://example-winery.com"
            />
            
            {/* Parse Website Button */}
            <Button
              variant="primary"
              onClick={handlePreview}
              disabled={!url || previewing}
              className="flex items-center gap-2 mt-3"
            >
              {previewing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Globe size={16} />
              )}
              Parse Website
            </Button>
          </div>

          {/* Tenant Slug */}
          <div className="mb-4">
            <label style={typography.body1R} className="block mb-2">Custom Tenant Slug (Optional)</label>
            <input
              type="text"
              value={tenantSlug}
              onChange={(e) => setTenantSlug(e.target.value)}
              className="w-full p-3 bg-white/5 border border-white/20 rounded-lg"
              placeholder="my-winery-name (auto-generated if empty)"
            />
            <p style={typography.body2} className="text-white/40 mt-1">
              Leave empty to auto-generate from winery name
            </p>
          </div>

          {/* Additional Paths */}
          <div className="mb-6">
            <label style={typography.body1R} className="block mb-2">Additional Pages to Crawl (Optional)</label>
            <p style={typography.body2} className="text-white/40 mb-3">
              Add specific page paths for comprehensive wine data extraction
            </p>
            
            {additionalPaths.map((path, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={path}
                  onChange={(e) => updateAdditionalPath(index, e.target.value)}
                  className="flex-1 p-3 bg-white/5 border border-white/20 rounded-lg"
                  placeholder="/wines, /portfolio, /current-releases"
                />
                {additionalPaths.length > 1 && (
                  <Button
                    variant="secondary"
                    onClick={() => removeAdditionalPath(index)}
                    className="px-3"
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
            
            <Button
              variant="secondary"
              onClick={addAdditionalPath}
              className="flex items-center gap-2 mt-2"
            >
              <Plus size={16} />
              Add Page
            </Button>
          </div>

          {/* Import Button - Only shown when preview data exists */}
          {preview && (
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={handleImport}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                Import Winery
              </Button>
            </div>
          )}
        </div>

        {/* Preview Results */}
        {preview && (
          <div className="bg-white/5 rounded-lg p-6 mb-8">
            <h3 style={typography.h3} className="mb-4">Preview Results</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 style={typography.body1B} className="mb-2">Winery Information</h4>
                <div className="space-y-2">
                  <p><span className="text-white/60">Name:</span> {preview.name}</p>
                  {preview.location && <p><span className="text-white/60">Location:</span> {preview.location}</p>}
                  {preview.established && <p><span className="text-white/60">Established:</span> {preview.established}</p>}
                  {preview.website && <p><span className="text-white/60">Website:</span> {preview.website}</p>}
                </div>
              </div>
              
              <div>
                <h4 style={typography.body1B} className="mb-2">Wine Collection</h4>
                <p><span className="text-white/60">Total Wines Found:</span> {preview.wineCount}</p>
                {preview.description && (
                  <p className="text-white/60 mt-2 text-sm">{preview.description}</p>
                )}
              </div>
            </div>

            {preview.wines.length > 0 && (
              <div>
                <h4 style={typography.body1B} className="mb-3">Sample Wines (First 10)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {preview.wines.map((wine, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-4">
                      <h5 style={typography.body1B} className="mb-1">{wine.name}</h5>
                      {wine.year && <p className="text-white/60 text-sm mb-1">{wine.year}</p>}
                      {wine.varietal && <p className="text-white/60 text-sm mb-1">{wine.varietal}</p>}
                      {wine.region && <p className="text-white/60 text-sm mb-1">{wine.region}</p>}
                      {wine.description && (
                        <p className="text-white/40 text-xs mt-2 line-clamp-2">{wine.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Import Success */}
        {importResult && (
          <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-6">
            <h3 style={typography.h3} className="text-green-400 mb-2">Import Successful!</h3>
            <p style={typography.body1R} className="text-green-300">
              Created winery with {importResult.winesCreated} wines (Tenant ID: {importResult.tenantId})
            </p>
            <p style={typography.body2} className="text-green-400/60 mt-2">
              You can now manage the imported wines in the wine editor or upload images using the Cloudinary integration.
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-6">
          <h3 style={typography.h3} className="text-blue-400 mb-3">How It Works</h3>
          <ul className="space-y-2 text-blue-300" style={typography.body2}>
            <li>• AI-powered parsing extracts wine names, vintages, descriptions, and ratings</li>
            <li>• Automatically creates tenant (winery) and populates wine database</li>
            <li>• Supports comprehensive crawling of multiple pages for complete collections</li>
            <li>• Preview function lets you verify data before importing</li>
            <li>• Images can be uploaded separately using the wine editor after import</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WineryImport;