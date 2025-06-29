import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useStandardToast } from "@/components/ui/feedback/StandardToast";
import { FormInput } from "@/components/ui/forms/FormInput";
import { ArrowLeft, Trash2, Upload } from "lucide-react";
import { Tenant } from "@/types/tenant";
import Button from "@/components/ui/buttons/Button";
import AppHeader, { HeaderSpacer } from "@/components/layout/AppHeader";
import typography from "@/styles/typography";
import ActionDropdown, { ActionDropdownItem } from "@/components/admin/ActionDropdown";
import TenantTabs from "../../components/ui/TenantTabs";
import DropdownInput from "@/components/ui/forms/DropdownInput";

// API helpers
const fetchTenantById = async (id: number) => {
  const res = await fetch(`/api/tenants/${id}`);
  if (!res.ok) throw new Error("Failed to fetch tenant");
  return res.json();
};

const createTenant = async (data: Omit<Tenant, "id">) => {
  const res = await fetch("/api/tenants", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create tenant");
  return res.json();
};

const updateTenant = async (id: number, data: Partial<Tenant>) => {
  const res = await fetch(`/api/tenants/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update tenant");
  return res.json();
};

const deleteTenant = async (id: number) => {
  const res = await fetch(`/api/tenants/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete tenant");
  return true;
};

const defaultTenant: Omit<Tenant, "id"> = {
  profile: {
    wineryName: "",
    wineryLogo: "",
    websiteURL: "",
    wineryDescription: "",
    yearEstablished: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    hoursOfOperation: "",
    socialMediaLinks: "",
  },
  cms: {
    wineEntries: [],
    wineClub: {
      clubName: "",
      description: "",
      membershipTiers: "",
      pricing: "",
      clubBenefits: "",
    },
  },
  aiModel: {
    knowledgeScope: "winery-only",
    personalityStyle: "sommelier",
    brandGuide: "",
    tonePreferences: "",
    knowledgeDocuments: "",
  },
};

const defaultTenantWithData: Omit<Tenant, "id"> = {
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
};

const TABS = [
  { key: 'profile', label: 'Profile' },
  { key: 'cms', label: 'CMS' },
  { key: 'wineclub', label: 'Wine club' },
  { key: 'ai', label: 'AI Model' },
];

interface TenantFormProps {
  mode: 'create' | 'edit';
}

// Helper to get query param
function getQueryParam(search: string, key: string): string | null {
  const params = new URLSearchParams(search);
  return params.get(key);
}

const TenantForm: React.FC<TenantFormProps> = ({ mode }) => {
  const { id } = useParams();
  const [{}, setLocation] = useLocation();
  const { toastSuccess, toastError } = useStandardToast();
  const [tenant, setTenant] = useState<Omit<Tenant, "id"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewTenant, setIsNewTenant] = useState(false);
  const searchParams = typeof window !== 'undefined' ? window.location.search : '';
  const initialTab = getQueryParam(searchParams, 'tab') || 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [search, setSearch] = useState('');
  const [scrolled, setScrolled] = useState(false);

  const isCreateMode = mode === 'create';

  // Мемоізуємо tenantId для запобігання зайвих ре-рендерів
  const tenantId = useMemo(() => {
    if (!id || id === "new") return null;
    const parsed = parseInt(id);
    return isNaN(parsed) ? null : parsed;
  }, [id]);

  // Використовуємо useCallback для стабільних функцій
  const handleCancel = useCallback(() => {
    setLocation('/somm-tenant-admin?tab=cms');
  }, [setLocation]);
  const handleAddWine = useCallback(() => setLocation('/wine-edit/new'), [setLocation]);
  const handleEditWine = useCallback((wineIndex: number) => setLocation(`/wine-edit/${wineIndex}`), [setLocation]);
  const handleSaveSuccess = useCallback(() => {
    setLocation('/somm-tenant-admin?tab=cms');
  }, [setLocation]);

  useEffect(() => {
    const loadTenant = async () => {
      if (isCreateMode) {
        setIsNewTenant(true);
        setTenant({ ...defaultTenantWithData });
        setLoading(false);
        return;
      }

      if (id === "new") {
        setIsNewTenant(true);
        setTenant({ ...defaultTenant });
        setLoading(false);
        return;
      }
      
      if (!tenantId) {
        setLoading(false);
        return;
      }
      
      try {
        const data = await fetchTenantById(tenantId);
        setTenant(data);
      } catch (error) {
        toastError("Failed to load tenant");
      } finally {
        setLoading(false);
      }
    };
    loadTenant();
  }, [tenantId, isCreateMode]); // Використовуємо tenantId замість id

  useEffect(() => {
    if (isCreateMode) {
      const handleScroll = () => setScrolled(window.scrollY > 0);
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [isCreateMode]);

  // Handlers for all fields
  const handleProfileChange = (field: string, value: string) => {
    setTenant((prev) =>
      prev
        ? { ...prev, profile: { ...prev.profile, [field]: value } }
        : prev
    );
  };

  const handleWineClubChange = (field: string, value: string) => {
    setTenant((prev) =>
      prev
        ? { ...prev, cms: { ...prev.cms, wineClub: { ...prev.cms.wineClub, [field]: value } } }
        : prev
    );
  };

  const handleAiModelChange = (field: string, value: string) => {
    setTenant((prev) =>
      prev
        ? { ...prev, aiModel: { ...prev.aiModel, [field]: value } }
        : prev
    );
  };

  // Save/Delete
  const handleSave = async () => {
    if (!tenant || !tenant.profile?.wineryName?.trim()) {
      toastError("Winery name is required");
      return;
    }
    try {
      if (isNewTenant) {
        await createTenant(tenant);
        toastSuccess("Tenant created successfully");
      } else {
        if (!tenantId) {
          toastError("Invalid tenant ID");
          return;
        }
        // Remove service fields before updating
        const { createdAt, updatedAt, id, ...tenantToSend } = tenant as any;
        await updateTenant(tenantId, tenantToSend);
        toastSuccess("Tenant updated successfully");
      }
      handleSaveSuccess();
    } catch (error) {
      toastError(isNewTenant ? "Failed to create tenant" : "Failed to update tenant");
    }
  };

  const handleDelete = async () => {
    if (isNewTenant || !tenantId) return;
    if (!window.confirm("Are you sure you want to delete this tenant? This action cannot be undone.")) return;
    try {
      await deleteTenant(tenantId);
      toastSuccess("Tenant deleted successfully");
      handleSaveSuccess();
    } catch (error) {
      toastError("Failed to delete tenant");
    }
  };

  // Dropdown actions
  const actions: ActionDropdownItem[] = [
    {
      label: "Delete Tenant",
      icon: <Trash2 size={16} />,
      onClick: handleDelete,
      colorClass: "text-red-400",
      disabled: false,
    },
  ];

  const pageTitle = isNewTenant ? "Add winery" : "Edit winery";

  // Filtered wines for CMS tab
  const filteredWines = tenant?.cms.wineEntries.filter(wine =>
    wine.wineName.toLowerCase().includes(search.toLowerCase())
  ) || [];

  // Tab change handler that updates the query param
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    const base = window.location.pathname;
    setLocation(`${base}?tab=${key}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <AppHeader title={pageTitle} showBackButton onBack={handleCancel} />
        <div className="pt-[75px] p-6">
          <div style={typography.body}>Loading tenant data...</div>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-black text-white">
        <AppHeader title={pageTitle} showBackButton onBack={handleCancel} />
        <div className="pt-[75px] p-6">
          <div style={typography.body}>Tenant not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mobile-fullscreen text-gray-600" style={{ backgroundColor: '#3a3a3a' }}>
      {/* Header */}
      {isCreateMode ? (
        // Fixed Header for create mode
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
      ) : (
        // AppHeader for edit mode
        <AppHeader
          title={pageTitle}
          showBackButton
          onBack={handleCancel}
          rightContent={!isNewTenant && tenantId ? <ActionDropdown actions={actions} /> : null}
        />
      )}

      {/* Content */}
      <div className={`${isCreateMode ? 'mt-20' : 'pt-[75px]'} p-6 pb-32`}>
        {/* Tabs */}
        <TenantTabs tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Tab content */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Unified profile form for both create and edit modes */}
            <FormInput
              label="Winery Name"
              type="text"
              value={tenant.profile?.wineryName || ""}
              onChange={(value: string) => handleProfileChange("wineryName", value)}
              placeholder="Winery name"
              required
            />
            {/* Winery Logo Upload */}
            <div className="mb-4">
              <label style={typography.body1R} className="block mb-2">Winery Logo</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center p-2 rounded-lg border border-white/20 w-[80px] h-[80px] bg-transparent">
                  {tenant.profile?.wineryLogo ? (
                    <img
                      src={tenant.profile.wineryLogo}
                      alt="Winery logo preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <span className="text-white/60 text-sm">Logo</span>
                  )}
                </div>
                <div>
                  <input
                    id="winery-logo-upload"
                    name="image"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!file.type.startsWith('image/')) {
                        toastError('Please select an image file');
                        return;
                      }
                      if (file.size > 10 * 1024 * 1024) {
                        toastError('Image size must be less than 10MB');
                        return;
                      }
                      try {
                        const formData = new FormData();
                        formData.append('image', file);
                        formData.append('wineryName', tenant.profile?.wineryName || '');
                        const response = await fetch('/api/upload-winery-logo', {
                          method: 'POST',
                          body: formData,
                        });
                        const result = await response.json();
                        if (result.success) {
                          handleProfileChange('wineryLogo', result.imageUrl);
                          toastSuccess('Logo uploaded successfully');
                        } else {
                          throw new Error(result.error || 'Upload failed');
                        }
                      } catch (error) {
                        toastError('Failed to upload logo');
                      }
                    }}
                  />
                  <Button
                    variant="secondary"
                    onClick={() => document.getElementById('winery-logo-upload')?.click()}
                    type="button"
                    className="flex items-center gap-2"
                  >
                    <Upload size={16} />
                    Upload Logo
                  </Button>
                </div>
              </div>
            </div>
            <FormInput
              label="Website"
              type="url"
              value={tenant.profile?.websiteURL || ""}
              onChange={(value: string) => handleProfileChange("websiteURL", value)}
              placeholder="https://example.com"
            />
            <FormInput
              label="Address"
              type="text"
              value={tenant.profile?.address || ""}
              onChange={(value: string) => handleProfileChange("address", value)}
              placeholder="Address"
            />
            <FormInput
              label="Phone"
              type="tel"
              value={tenant.profile?.contactPhone || ""}
              onChange={(value: string) => handleProfileChange("contactPhone", value)}
              placeholder="Phone"
            />
            <FormInput
              label="Email"
              type="email"
              value={tenant.profile?.contactEmail || ""}
              onChange={(value: string) => handleProfileChange("contactEmail", value)}
              placeholder="Email"
            />
            <FormInput
              label="Year Established"
              type="text"
              value={tenant.profile?.yearEstablished || ""}
              onChange={(value: string) => handleProfileChange("yearEstablished", value)}
              placeholder="Year established"
            />
            <FormInput
              label="Hours of Operation"
              type="text"
              value={tenant.profile?.hoursOfOperation || ""}
              onChange={(value: string) => handleProfileChange("hoursOfOperation", value)}
              placeholder="Hours of operation"
            />
            <FormInput
              label="Social Media Links"
              type="text"
              value={tenant.profile?.socialMediaLinks || ""}
              onChange={(value: string) => handleProfileChange("socialMediaLinks", value)}
              placeholder="Social media links"
            />
            <FormInput
              label="Winery Description"
              type="text"
              value={tenant.profile?.wineryDescription || ""}
              onChange={(value: string) => handleProfileChange("wineryDescription", value)}
              placeholder="Winery description"
            />
            {/* HomeGlobal Link (slug) */}
            <div className="mb-4 flex items-end gap-2">
              <div className="flex-1">
                <label style={typography.body1R} className="block mb-2">HomeGlobal Link</label>
                <input
                  type="text"
                  value={`/homeglobal/${
                    (tenant.profile?.wineryName || "")
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-+|-+$/g, '')
                  }`}
                  readOnly
                  className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-gray-400 cursor-not-allowed"
                />
              </div>
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  const slug = (tenant.profile?.wineryName || "")
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '');
                  window.open(`/homeglobal/${slug}`, '_blank');
                }}
                className="h-[48px] flex items-center justify-center px-3"
                aria-label="Open HomeGlobal page"
                hug
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 13V19A2 2 0 0 1 16 21H5A2 2 0 0 1 3 19V8A2 2 0 0 1 5 6H11M15 3H21M21 3V9M21 3L10 14" /></svg>
              </Button>
            </div>
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
              <Button onClick={handleAddWine} variant="secondary" hug className="ml-3">+ Add wine</Button>
            </div>
            {/* Wine list */}
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
            {isCreateMode ? (
              // FormInput components for create mode
              <>
                <FormInput
                  label="Club Name"
                  type="text"
                  value={tenant.cms?.wineClub?.clubName || ""}
                  onChange={(value: string) => handleWineClubChange("clubName", value)}
                  placeholder="Club name"
                />
                <FormInput
                  label="Club Description"
                  type="text"
                  value={tenant.cms?.wineClub?.description || ""}
                  onChange={(value: string) => handleWineClubChange("description", value)}
                  placeholder="Club description"
                />
                <FormInput
                  label="Membership Tiers"
                  type="text"
                  value={tenant.cms?.wineClub?.membershipTiers || ""}
                  onChange={(value: string) => handleWineClubChange("membershipTiers", value)}
                  placeholder="Membership tiers"
                />
                <FormInput
                  label="Pricing"
                  type="text"
                  value={tenant.cms?.wineClub?.pricing || ""}
                  onChange={(value: string) => handleWineClubChange("pricing", value)}
                  placeholder="Pricing"
                />
                <FormInput
                  label="Club Benefits"
                  type="text"
                  value={tenant.cms?.wineClub?.clubBenefits || ""}
                  onChange={(value: string) => handleWineClubChange("clubBenefits", value)}
                  placeholder="Club benefits"
                />
              </>
            ) : (
              // Regular inputs for edit mode
              <>
                {Object.entries(tenant.cms.wineClub).map(([key, value]) => (
                  <div key={key} className="mb-2">
                    <label style={typography.body1R} className="block mb-1">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
                    <input
                      type="text"
                      value={value}
                      onChange={e => handleWineClubChange(key, e.target.value)}
                      className="w-full p-3 bg-white/5 border border-white/20 rounded-lg"
                      placeholder={key}
                    />
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-6">
            {isCreateMode ? (
              // DropdownInput components for create mode
              <>
                <DropdownInput
                  label="Knowledge Scope"
                  value={tenant.aiModel?.knowledgeScope || ""}
                  onChange={(value: string) => handleAiModelChange("knowledgeScope", value)}
                  options={[
                    { value: "winery-only", label: "winery-only" },
                    { value: "winery-plus-global", label: "winery-plus-global" },
                  ]}
                  placeholder="Knowledge Scope"
                />
                <DropdownInput
                  label="Personality Style"
                  value={tenant.aiModel?.personalityStyle || ""}
                  onChange={(value: string) => handleAiModelChange("personalityStyle", value)}
                  options={[
                    { value: "educator", label: "educator" },
                    { value: "sommelier", label: "sommelier" },
                    { value: "tasting-room-host", label: "tasting-room-host" },
                    { value: "luxury-concierge", label: "luxury-concierge" },
                    { value: "casual-friendly", label: "casual-friendly" },
                  ]}
                  placeholder="Personality Style"
                />
                <FormInput
                  label="Brand Guide"
                  type="text"
                  value={tenant.aiModel?.brandGuide || ""}
                  onChange={(value: string) => handleAiModelChange("brandGuide", value)}
                  placeholder="Brand Guide"
                />
                <FormInput
                  label="Tone Preferences"
                  type="text"
                  value={tenant.aiModel?.tonePreferences || ""}
                  onChange={(value: string) => handleAiModelChange("tonePreferences", value)}
                  placeholder="Tone Preferences"
                />
                <FormInput
                  label="Knowledge Documents"
                  type="text"
                  value={tenant.aiModel?.knowledgeDocuments || ""}
                  onChange={(value: string) => handleAiModelChange("knowledgeDocuments", value)}
                  placeholder="Knowledge Documents"
                />
              </>
            ) : (
              // Regular inputs with selects for edit mode
              <>
                <div className="mb-2">
                  <label className="block text-white mb-1">Knowledge Scope</label>
                  <select
                    className="w-full p-2 rounded bg-black/20 text-white"
                    value={tenant.aiModel.knowledgeScope}
                    onChange={e => handleAiModelChange("knowledgeScope", e.target.value)}
                  >
                    <option value="winery-only">winery-only</option>
                    <option value="winery-plus-global">winery-plus-global</option>
                  </select>
                </div>
                <div className="mb-2">
                  <label className="block text-white mb-1">Personality Style</label>
                  <select
                    className="w-full p-2 rounded bg-black/20 text-white"
                    onChange={e => handleAiModelChange("personalityStyle", e.target.value)}
                  >
                    <option value="educator">educator</option>
                    <option value="sommelier">sommelier</option>
                    <option value="tasting-room-host">tasting-room-host</option>
                    <option value="luxury-concierge">luxury-concierge</option>
                    <option value="casual-friendly">casual-friendly</option>
                  </select>
                </div>
                <div>
                  <label style={typography.body1R} className="block mb-2">Brand Guide</label>
                  <input
                    type="text"
                    value={tenant.aiModel.brandGuide}
                    onChange={e => handleAiModelChange("brandGuide", e.target.value)}
                    className="w-full p-3 bg-white/5 border border-white/20 rounded-lg"
                    placeholder="Brand Guide"
                  />
                </div>
                <div>
                  <label style={typography.body1R} className="block mb-2">Tone Preferences</label>
                  <input
                    type="text"
                    value={tenant.aiModel.tonePreferences}
                    onChange={e => handleAiModelChange("tonePreferences", e.target.value)}
                    className="w-full p-3 bg-white/5 border border-white/20 rounded-lg"
                    placeholder="Tone Preferences"
                  />
                </div>
                <div>
                  <label style={typography.body1R} className="block mb-2">Knowledge Documents</label>
                  <input
                    type="text"
                    value={tenant.aiModel.knowledgeDocuments}
                    onChange={e => handleAiModelChange("knowledgeDocuments", e.target.value)}
                    className="w-full p-3 bg-white/5 border border-white/20 rounded-lg"
                    placeholder="Knowledge Documents"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Save Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/90 backdrop-blur-sm border-t border-white/10 z-50">
          <Button
            variant="primary"
            onClick={handleSave}
            className="w-full text-lg font-medium py-4"
          >
            {isCreateMode ? "Create" : isNewTenant ? "Add winery" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TenantForm; 