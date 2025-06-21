import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useStandardToast } from '@/components/ui/feedback/StandardToast';
import { FormInput } from "@/components/ui/forms/FormInput";
import { ArrowLeft } from "lucide-react";
import { Tenant } from "@/types/tenant";
import Button from "@/components/ui/buttons/Button";

const TABS = [
  { key: 'profile', label: 'Profile' },
  { key: 'cms', label: 'CMS' },
  { key: 'wineclub', label: 'Wine club' },
  { key: 'ai', label: 'AI Model' },
];

export default function TenantCreate() {
  const [, setLocation] = useLocation();
  const { toastSuccess, toastError } = useStandardToast();
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [search, setSearch] = useState('');

  // Базова структура для вкладених полів
  const [formData, setFormData] = useState<Partial<Tenant>>({
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

  // Фільтровані вина для CMS табу
  const filteredWines = formData.cms?.wineEntries?.filter(wine =>
    wine.wineName.toLowerCase().includes(search.toLowerCase())
  ) || [];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    if (!formData.profile?.wineryName?.trim()) {
      toastError("Winery name is required");
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

  // Навігація до сторінки додавання вина
  const handleAddWine = () => {
    setLocation('/wine-edit/new');
  };

  // Навігація до сторінки редагування вина
  const handleEditWine = (wineIndex: number) => {
    setLocation(`/wine-edit/${wineIndex}`);
  };

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
      {/* Tabs */}
      <div className="flex mb-6 mt-20">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`px-4 py-2 rounded-full mx-1 ${activeTab === tab.key ? 'bg-white text-black' : 'bg-black text-white border border-white/20'}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Tab content */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Profile */}
          <div className="pt-2 pb-1 text-white font-semibold">Profile</div>
          <FormInput
            label="Winery Name"
            type="text"
            value={formData.profile?.wineryName || ""}
            onChange={(value: string) => handleNestedChange("profile", "wineryName", value)}
            placeholder="Winery name"
            required
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
        </div>
      )}
      {activeTab === 'cms' && (
        <div>
          <div className="flex items-center mb-4">
            <input
              type="text"
              placeholder="Search wines..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 p-2 rounded bg-black/20 text-white border border-white/20"
            />
            <Button className="ml-2" onClick={handleAddWine}>+ Add wine</Button>
          </div>
          {/* Список вин */}
          <div>
            {filteredWines.map((wine, idx) => (
              <div key={idx} className="flex items-center p-2 border-b border-white/10 cursor-pointer" onClick={() => handleEditWine(idx)}>
                <span className="text-white flex-1">{wine.wineName}</span>
                <span className="text-xs text-gray-400 ml-2">ID: {idx+1}</span>
              </div>
            ))}
            {filteredWines.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p>No wines found</p>
                <p className="text-sm mt-2">Click "Add wine" to get started</p>
              </div>
            )}
          </div>
        </div>
      )}
      {activeTab === 'wineclub' && (
        <div className="space-y-6">
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
        </div>
      )}
      {activeTab === 'ai' && (
        <div className="space-y-6">
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
      )}
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