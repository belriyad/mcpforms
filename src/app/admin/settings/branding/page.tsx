'use client';

/**
 * Branding Settings Page
 * Feature #18: Basic Branding
 * 
 * Manage logo, colors, and company branding
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Trash2, Save, AlertCircle, Check, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  getBranding, 
  updateBranding, 
  uploadLogo, 
  deleteLogo,
  resetBranding,
  isValidHexColor,
  Branding,
  DEFAULT_BRANDING 
} from '@/lib/branding';
import { isFeatureEnabled } from '@/lib/feature-flags';

export default function BrandingSettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [branding, setBranding] = useState<Branding>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const featureEnabled = isFeatureEnabled('brandingBasic');

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }

    if (!featureEnabled) {
      router.push('/admin');
      return;
    }

    loadBranding();
  }, [user, authLoading, featureEnabled, router]);

  const loadBranding = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await getBranding(user.uid);
      setBranding(data);
    } catch (err) {
      setError('Failed to load branding settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      // Delete old logo if exists
      if (branding.logoStoragePath) {
        await deleteLogo(branding.logoStoragePath);
      }

      // Upload new logo
      const { url, path } = await uploadLogo(user.uid, file);

      // Update branding
      const newBranding = {
        ...branding,
        logoUrl: url,
        logoStoragePath: path,
      };
      
      await updateBranding(user.uid, newBranding);
      setBranding(newBranding);
      setSuccess('Logo uploaded successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload logo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLogoDelete = async () => {
    if (!user || !branding.logoStoragePath) return;

    if (!confirm('Are you sure you want to delete your logo?')) return;

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      await deleteLogo(branding.logoStoragePath);
      
      const newBranding = {
        ...branding,
        logoUrl: null,
        logoStoragePath: null,
      };
      
      await updateBranding(user.uid, newBranding);
      setBranding(newBranding);
      setSuccess('Logo deleted successfully!');
    } catch (err) {
      setError('Failed to delete logo');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate colors
    if (!isValidHexColor(branding.accentColor)) {
      setError('Invalid accent color. Please use hex format (#RRGGBB)');
      return;
    }
    if (!isValidHexColor(branding.primaryColor)) {
      setError('Invalid primary color. Please use hex format (#RRGGBB)');
      return;
    }

    if (!branding.companyName.trim()) {
      setError('Company name is required');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateBranding(user.uid, branding);
      setSuccess('Branding saved successfully!');
    } catch (err) {
      setError('Failed to save branding');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!user) return;

    if (!confirm('Reset all branding to defaults? This will delete your logo.')) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await resetBranding(user.uid);
      await loadBranding();
      setSuccess('Branding reset to defaults!');
    } catch (err) {
      setError('Failed to reset branding');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading branding settings...</p>
        </div>
      </div>
    );
  }

  if (!featureEnabled) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin')}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Branding</h1>
                <p className="text-gray-600 mt-1">Customize your intake forms and emails</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-green-700">{success}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Logo Section */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Logo</h2>
            
            <div className="space-y-4">
              {/* Current Logo */}
              {branding.logoUrl ? (
                <div className="flex items-center gap-4">
                  <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
                    <img 
                      src={branding.logoUrl} 
                      alt="Logo" 
                      className="max-h-20 max-w-xs object-contain"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleLogoDelete}
                    disabled={uploading}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No logo uploaded</p>
                </div>
              )}

              {/* Upload Button */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      {branding.logoUrl ? 'Replace Logo' : 'Upload Logo'}
                    </>
                  )}
                </Button>
              </div>

              {/* Guidelines */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Recommended:</strong> PNG or SVG, max 200x80px, transparent background. Max file size: 5MB.
                </p>
              </div>
            </div>
          </Card>

          {/* Colors Section */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Colors</h2>
            
            <div className="space-y-4">
              {/* Accent Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Accent Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={branding.accentColor}
                    onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                    className="h-12 w-24 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={branding.accentColor}
                    onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                    placeholder="#6366f1"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Used for primary buttons and key UI elements
                </p>
              </div>

              {/* Primary Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={branding.primaryColor}
                    onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                    className="h-12 w-24 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={branding.primaryColor}
                    onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                    placeholder="#3b82f6"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Used for links and secondary UI elements
                </p>
              </div>

              {/* Preview */}
              <div className="border-2 border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Preview:</p>
                <div className="flex gap-3">
                  <button 
                    className="px-4 py-2 rounded-lg text-white font-medium"
                    style={{ backgroundColor: branding.accentColor }}
                  >
                    Accent Button
                  </button>
                  <button 
                    className="px-4 py-2 rounded-lg text-white font-medium"
                    style={{ backgroundColor: branding.primaryColor }}
                  >
                    Primary Button
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Company Info Section */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Company Information</h2>
            
            <div className="space-y-4">
              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={branding.companyName}
                  onChange={(e) => setBranding({ ...branding, companyName: e.target.value })}
                  placeholder="Your Company Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Tagline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tagline (optional)
                </label>
                <input
                  type="text"
                  value={branding.tagline || ''}
                  onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
                  placeholder="Your tagline or slogan"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={saving || uploading}
              className="text-gray-600"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>

            <Button
              onClick={handleSave}
              disabled={saving || uploading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Branding
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
