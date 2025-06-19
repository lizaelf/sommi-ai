import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useStandardToast } from '@/components/ui/feedback/StandardToast';
import Button from "@/components/ui/buttons/Button";
import { FormInput } from "@/components/ui/forms/FormInput";
import typography from "@/styles/typography";
import { ArrowLeft, Save, X, Globe } from "lucide-react";

interface TenantFormData {
  name: string;
  website: string;
  status: 'active' | 'inactive';
}

export default function TenantCreate() {
  const [, setLocation] = useLocation();
  const { toastSuccess, toastError } = useStandardToast();
  const [scrolled, setScrolled] = useState(false);
  const [parsing, setParsing] = useState(false);
  
  const [formData, setFormData] = useState<TenantFormData>({
    name: '',
    website: '',
    status: 'active'
  });

  // Handle scroll for header styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);



  const handleInputChange = (field: keyof TenantFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Validate required fields
    if (!formData.name.trim()) {
      toastError("Tenant name is required");
      return;
    }



    try {
      // Get existing tenants
      const existingTenants = JSON.parse(localStorage.getItem('sommelier-tenants') || '[]');
      


      // Create new tenant
      const newTenant = {
        id: Date.now(),
        ...formData,
        createdAt: new Date().toISOString(),
      };

      // Save to localStorage
      const updatedTenants = [...existingTenants, newTenant];
      localStorage.setItem('sommelier-tenants', JSON.stringify(updatedTenants));

      toastSuccess("Tenant created successfully", "Success");

      // Navigate back to tenant admin
      setLocation('/somm-tenant-admin');
    } catch (error) {
      toastError("Failed to create tenant");
    }
  };

  const handleCancel = () => {
    setLocation('/somm-tenant-admin');
  };

  const handleParseWebsite = async () => {
    if (!formData.website) {
      toastError('Please enter a website URL first');
      return;
    }

    setParsing(true);
    try {
      const response = await fetch('/api/auto-populate-winery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: formData.website,
          additionalPaths: ['/wines', '/portfolio', '/current-releases']
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to parse website');
      }

      const result = await response.json();
      toastSuccess(`Successfully created ${result.winery} with ${result.winesCreated} wines`);
      
      // Navigate back to admin after successful import
      setLocation('/tenant-admin');
      
    } catch (error) {
      console.error('Parse error:', error);
      toastError(error instanceof Error ? error.message : 'Failed to parse website');
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="min-h-screen mobile-fullscreen" style={{ backgroundColor: '#3a3a3a' }}>
      {/* Fixed Header */}
      <div className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 transition-all duration-200 ${
        scrolled ? 'bg-black/90 backdrop-blur-sm border-b border-white/10' : 'bg-transparent'
      }`}>
        <button 
          onClick={handleCancel}
          className="tertiary-button flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 
          className="text-lg font-medium"
          style={{
            color: "white"
          }}
        >
          Create New Tenant
        </h1>
        <div className="w-10"></div>
      </div>
      {/* Content */}
      <div style={{ paddingTop: "100px", paddingLeft: "24px", paddingRight: "24px", paddingBottom: "120px" }}>
        <div className="space-y-6">
          {/* Tenant Name */}
          <FormInput
            label="Winery"
            type="text"
            value={formData.name}
            onChange={(value: string) => handleInputChange('name', value)}
            placeholder="Enter tenant name"
            required
          />

          {/* Website */}
          <FormInput
            label="Website"
            type="url"
            value={formData.website}
            onChange={(value: string) => handleInputChange('website', value)}
            placeholder="https://example.com"
          />

          {/* Parse Website Button */}
          <div className="mt-4">
            <button
              onClick={handleParseWebsite}
              disabled={!formData.website || parsing}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={typography.body1R}
            >
              {parsing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Parsing website...
                </>
              ) : (
                <>
                  <Globe size={16} />
                  Parse website automatically
                </>
              )}
            </button>
            <p className="text-white/40 text-xs mt-2" style={typography.body1R}>
              Extract winery and wine data automatically from website
            </p>
          </div>

        </div>
      </div>
      {/* Bottom Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/90 backdrop-blur-sm border-t border-white/10">
        <button
          onClick={handleSave}
          className="w-full flex items-center justify-center px-6 py-4 bg-[#6A53E7] text-white rounded-lg hover:bg-[#5a43d7] transition-colors font-medium text-lg"
        >
          Create
        </button>
      </div>
    </div>
  );
}