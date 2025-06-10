import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/UseToast";
import Button from "@/components/ui/Button";
import typography from "@/styles/typography";
import { ArrowLeft, Save, X } from "lucide-react";

interface TenantFormData {
  name: string;
  slug: string;
  description: string;
  status: 'active' | 'inactive';
}

export default function TenantCreate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [scrolled, setScrolled] = useState(false);
  
  const [formData, setFormData] = useState<TenantFormData>({
    name: '',
    slug: '',
    description: '',
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

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleInputChange = (field: keyof TenantFormData, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-generate slug when name changes
      if (field === 'name') {
        updated.slug = generateSlug(value);
      }
      
      return updated;
    });
  };

  const handleSave = () => {
    // Validate required fields
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Tenant name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.slug.trim()) {
      toast({
        title: "Error", 
        description: "Slug is required",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get existing tenants
      const existingTenants = JSON.parse(localStorage.getItem('sommelier-tenants') || '[]');
      
      // Check if slug already exists
      if (existingTenants.some((t: any) => t.slug === formData.slug)) {
        toast({
          title: "Error",
          description: "A tenant with this slug already exists",
          variant: "destructive",
        });
        return;
      }

      // Create new tenant
      const newTenant = {
        id: Date.now(),
        ...formData,
        createdAt: new Date().toISOString(),
      };

      // Save to localStorage
      const updatedTenants = [...existingTenants, newTenant];
      localStorage.setItem('sommelier-tenants', JSON.stringify(updatedTenants));

      toast({
        title: "Success",
        description: "Tenant created successfully",
      });

      // Navigate back to tenant admin
      setLocation('/somm-tenant-admin');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create tenant",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setLocation('/somm-tenant-admin');
  };

  return (
    <div className="min-h-screen mx-auto" style={{ backgroundColor: '#3a3a3a', maxWidth: '1200px' }}>
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
          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: "white" }}
            >Winery *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
              placeholder="Enter tenant name"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            />
          </div>

          {/* Slug */}
          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: "white" }}
            >
              Slug *
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => handleInputChange('slug', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
              placeholder="tenant-slug"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            />
            <p className="text-xs text-white/60 mt-1">
              URL-friendly identifier (auto-generated from name)
            </p>
          </div>

          {/* Description */}
          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: "white" }}
            >
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
              placeholder="Describe the tenant..."
              rows={4}
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            />
          </div>

          {/* Status */}
          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: "white" }}
            >
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value as 'active' | 'inactive')}
              className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-white/30"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            >
              <option value="active" style={{ backgroundColor: '#3a3a3a', color: 'white' }}>Active</option>
              <option value="inactive" style={{ backgroundColor: '#3a3a3a', color: 'white' }}>Inactive</option>
            </select>
          </div>
        </div>
      </div>
      {/* Bottom Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/90 backdrop-blur-sm border-t border-white/10">
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 flex items-center justify-center px-4 py-3 border border-white/20 rounded-lg text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center px-4 py-3 bg-white text-black rounded-lg hover:bg-white/90 transition-colors font-medium"
          >
            Create Tenant
          </button>
        </div>
      </div>
    </div>
  );
}