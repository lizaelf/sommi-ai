import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useStandardToast } from "@/components/ui/StandardToast";
import Button from "@/components/ui/Button";
import { FormInput } from "@/components/ui/forms/FormInput";
import typography from "@/styles/typography";
import { ArrowLeft, Save, X } from "lucide-react";

interface TenantFormData {
  name: string;
  website: string;
  status: 'active' | 'inactive';
}

export default function TenantCreate() {
  const [, setLocation] = useLocation();
  const { toastSuccess, toastError, toastInfo } = useStandardToast();
  const [scrolled, setScrolled] = useState(false);
  
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