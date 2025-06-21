import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useStandardToast } from '@/components/ui/feedback/StandardToast';
import { FormInput } from "@/components/ui/forms/FormInput";
import { ArrowLeft } from "lucide-react";
import { Tenant } from "@/types/tenant";

export default function TenantCreate() {
  const [, setLocation] = useLocation();
  const { toastSuccess, toastError } = useStandardToast();
  const [scrolled, setScrolled] = useState(false);

  // Базова структура для вкладених полів
  const [formData, setFormData] = useState<Partial<Tenant>>({
    name: "Test Winery",
    slug: "test-winery",
    logo: "https://example.com/logo.png",
    description: "A premium winery specializing in fine wines",
    aiTone: "Professional and educational",
    profile: {
      wineryName: "Test Winery & Vineyards",
      wineryDescription: "Family-owned winery producing exceptional wines since 1995",
      yearEstablished: "1995",
      wineryLogo: "https://example.com/winery-logo.png",
      contactEmail: "info@testwinery.com",
      contactPhone: "+1-555-123-4567",
      websiteURL: "https://testwinery.com",
      address: "123 Wine Valley Road, Napa, CA 94558",
      hoursOfOperation: "Mon-Fri: 10AM-6PM, Sat-Sun: 11AM-7PM",
      socialMediaLinks: "Instagram: @testwinery, Facebook: /testwinery",
    },
    cms: {
      wineEntries: [],
      wineClub: {
        clubName: "Test Winery Club",
        description: "Exclusive wine club for connoisseurs",
        membershipTiers: "Bronze, Silver, Gold, Platinum",
        pricing: "Bronze: $99/year, Silver: $199/year, Gold: $299/year, Platinum: $499/year",
        clubBenefits: "Monthly wine shipments, exclusive tastings, member discounts",
      },
    },
    aiModel: {
      knowledgeScope: "winery-only",
      personalityStyle: "educator",
      brandGuide: "Professional, knowledgeable, approachable",
      tonePreferences: "Educational but friendly, not overly formal",
      knowledgeDocuments: "Wine production guides, tasting notes, food pairing recommendations",
    },
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Для простих полів
  const handleInputChange = (field: keyof Tenant, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Для вкладених полів
  const handleNestedChange = <T extends keyof Tenant>(
    section: T,
    field: string,
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...((prev[section] as object) || {}),
        [field]: value,
      },
    }));
  };

  // Для вкладених полів wineClub
  const handleWineClubChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      cms: {
        ...prev.cms,
        wineEntries: prev.cms?.wineEntries || [],
        wineClub: {
          clubName: prev.cms?.wineClub?.clubName || "",
          description: prev.cms?.wineClub?.description || "",
          membershipTiers: prev.cms?.wineClub?.membershipTiers || "",
          pricing: prev.cms?.wineClub?.pricing || "",
          clubBenefits: prev.cms?.wineClub?.clubBenefits || "",
          [field]: value,
        },
      },
    }));
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      toastError("Tenant name is required");
      return;
    }
    try {
      const res = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to create tenant");
      toastSuccess("Tenant created successfully", "Success");
      setLocation('/somm-tenant-admin');
    } catch (error) {
      toastError("Failed to create tenant");
    }
  };

  const handleCancel = () => setLocation('/somm-tenant-admin');

  return (
    <div className="min-h-screen mobile-fullscreen text-gray-600" style={{ backgroundColor: '#3a3a3a' }}>
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
        <h1 className="text-lg font-medium" style={{ color: "white" }}>
          Create New Tenant
        </h1>
        <div className="w-10"></div>
      </div>
      {/* Content */}
      <div style={{ paddingTop: "100px", paddingLeft: "24px", paddingRight: "24px", paddingBottom: "120px" }}>
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="pt-2 pb-1 text-white font-semibold">Basic Information</div>
          <FormInput
            label="Winery Name"
            type="text"
            value={formData.name || ""}
            onChange={(value: string) => handleInputChange('name', value)}
            placeholder="Enter winery name"
            required
          />
          <FormInput
            label="Slug"
            type="text"
            value={formData.slug || ""}
            onChange={(value: string) => handleInputChange('slug', value)}
            placeholder="winery-slug"
          />
          <FormInput
            label="Logo URL"
            type="url"
            value={formData.logo || ""}
            onChange={(value: string) => handleInputChange('logo', value)}
            placeholder="https://example.com/logo.png"
          />
          <FormInput
            label="Description"
            type="text"
            value={formData.description || ""}
            onChange={(value: string) => handleInputChange('description', value)}
            placeholder="General description"
          />
          <FormInput
            label="AI Tone"
            type="text"
            value={formData.aiTone || ""}
            onChange={(value: string) => handleInputChange('aiTone', value)}
            placeholder="AI tone description"
          />

          {/* Profile */}
          <div className="pt-2 pb-1 text-white font-semibold">Profile</div>
          <FormInput
            label="Winery Name (Profile)"
            type="text"
            value={formData.profile?.wineryName || ""}
            onChange={(value: string) => handleNestedChange("profile", "wineryName", value)}
            placeholder="Winery name"
          />
          <FormInput
            label="Website"
            type="url"
            value={formData.profile?.websiteURL || ""}
            onChange={(value: string) => handleNestedChange("profile", "websiteURL", value)}
            placeholder="https://example.com"
          />
          <FormInput
            label="Address"
            type="text"
            value={formData.profile?.address || ""}
            onChange={(value: string) => handleNestedChange("profile", "address", value)}
            placeholder="Address"
          />
          <FormInput
            label="Phone"
            type="tel"
            value={formData.profile?.contactPhone || ""}
            onChange={(value: string) => handleNestedChange("profile", "contactPhone", value)}
            placeholder="Phone"
          />
          <FormInput
            label="Email"
            type="email"
            value={formData.profile?.contactEmail || ""}
            onChange={(value: string) => handleNestedChange("profile", "contactEmail", value)}
            placeholder="Email"
          />
          <FormInput
            label="Year Established"
            type="text"
            value={formData.profile?.yearEstablished || ""}
            onChange={(value: string) => handleNestedChange("profile", "yearEstablished", value)}
            placeholder="Year established"
          />
          <FormInput
            label="Winery Logo URL"
            type="url"
            value={formData.profile?.wineryLogo || ""}
            onChange={(value: string) => handleNestedChange("profile", "wineryLogo", value)}
            placeholder="https://example.com/winery-logo.png"
          />
          <FormInput
            label="Hours of Operation"
            type="text"
            value={formData.profile?.hoursOfOperation || ""}
            onChange={(value: string) => handleNestedChange("profile", "hoursOfOperation", value)}
            placeholder="Hours of operation"
          />
          <FormInput
            label="Social Media Links"
            type="text"
            value={formData.profile?.socialMediaLinks || ""}
            onChange={(value: string) => handleNestedChange("profile", "socialMediaLinks", value)}
            placeholder="Social media links"
          />
          <FormInput
            label="Winery Description"
            type="text"
            value={formData.profile?.wineryDescription || ""}
            onChange={(value: string) => handleNestedChange("profile", "wineryDescription", value)}
            placeholder="Winery description"
          />

          {/* Wine Club */}
          <div className="pt-2 pb-1 text-white font-semibold">Wine Club</div>
          <FormInput
            label="Club Name"
            type="text"
            value={formData.cms?.wineClub?.clubName || ""}
            onChange={(value: string) => handleWineClubChange("clubName", value)}
            placeholder="Club name"
          />
          <FormInput
            label="Club Description"
            type="text"
            value={formData.cms?.wineClub?.description || ""}
            onChange={(value: string) => handleWineClubChange("description", value)}
            placeholder="Club description"
          />
          <FormInput
            label="Membership Tiers"
            type="text"
            value={formData.cms?.wineClub?.membershipTiers || ""}
            onChange={(value: string) => handleWineClubChange("membershipTiers", value)}
            placeholder="Membership tiers"
          />
          <FormInput
            label="Pricing"
            type="text"
            value={formData.cms?.wineClub?.pricing || ""}
            onChange={(value: string) => handleWineClubChange("pricing", value)}
            placeholder="Pricing"
          />
          <FormInput
            label="Club Benefits"
            type="text"
            value={formData.cms?.wineClub?.clubBenefits || ""}
            onChange={(value: string) => handleWineClubChange("clubBenefits", value)}
            placeholder="Club benefits"
          />

          {/* AI Model */}
          <div className="pt-2 pb-1 text-white font-semibold">AI Model</div>
          <FormInput
            label="Knowledge Scope"
            type="text"
            value={formData.aiModel?.knowledgeScope || ""}
            onChange={(value: string) => handleNestedChange("aiModel", "knowledgeScope", value)}
            placeholder="Knowledge Scope"
          />
          <FormInput
            label="Personality Style"
            type="text"
            value={formData.aiModel?.personalityStyle || ""}
            onChange={(value: string) => handleNestedChange("aiModel", "personalityStyle", value)}
            placeholder="Personality Style"
          />
          <FormInput
            label="Brand Guide"
            type="text"
            value={formData.aiModel?.brandGuide || ""}
            onChange={(value: string) => handleNestedChange("aiModel", "brandGuide", value)}
            placeholder="Brand Guide"
          />
          <FormInput
            label="Tone Preferences"
            type="text"
            value={formData.aiModel?.tonePreferences || ""}
            onChange={(value: string) => handleNestedChange("aiModel", "tonePreferences", value)}
            placeholder="Tone Preferences"
          />
          <FormInput
            label="Knowledge Documents"
            type="text"
            value={formData.aiModel?.knowledgeDocuments || ""}
            onChange={(value: string) => handleNestedChange("aiModel", "knowledgeDocuments", value)}
            placeholder="Knowledge Documents"
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