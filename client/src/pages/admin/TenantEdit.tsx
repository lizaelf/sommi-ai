import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useStandardToast } from "@/components/ui/feedback/StandardToast";
import AppHeader from "@/components/layout/AppHeader";
import Button from "@/components/ui/buttons/Button";
import typography from "@/styles/typography";
import { Trash2 } from "lucide-react";
import ActionDropdown, { ActionDropdownItem } from "@/components/admin/ActionDropdown";
import { Tenant } from "@/types/tenant";

// API helpers (замініть на ваші реальні)
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
    wineryDescription: "",
    yearEstablished: "",
    wineryLogo: "",
    contactEmail: "",
    contactPhone: "",
    websiteURL: "",
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

const TABS = [
  { key: 'profile', label: 'Profile' },
  { key: 'cms', label: 'CMS' },
  { key: 'wineclub', label: 'Wine club' },
  { key: 'ai', label: 'AI Model' },
];

const TenantEdit: React.FC = () => {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toastSuccess, toastError } = useStandardToast();
  const [tenant, setTenant] = useState<Omit<Tenant, "id"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewTenant, setIsNewTenant] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadTenant = async () => {
      if (id === "new") {
        setIsNewTenant(true);
        setTenant({ ...defaultTenant });
        setLoading(false);
        return;
      }
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const tenantId = parseInt(id);
        if (isNaN(tenantId)) {
          setLoading(false);
          return;
        }
        const data = await fetchTenantById(tenantId);
        setTenant(data);
      } catch (error) {
        toastError("Failed to load tenant");
      } finally {
        setLoading(false);
      }
    };
    loadTenant();
    // eslint-disable-next-line
  }, [id]);

  // --- Handlers for all fields ---
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
  const handleWineEntryChange = (index: number, field: string, value: string) => {
    setTenant((prev) => {
      if (!prev) return prev;
      const wineEntries = [...prev.cms.wineEntries];
      wineEntries[index] = { ...wineEntries[index], [field]: value };
      return { ...prev, cms: { ...prev.cms, wineEntries } };
    });
  };
  const addWineEntry = () => {
    setTenant((prev) =>
      prev
        ? {
            ...prev,
            cms: {
              ...prev.cms,
              wineEntries: [
                ...prev.cms.wineEntries,
                {
                  wineName: "",
                  vintageYear: "",
                  sku: "",
                  varietal: "",
                  tastingNotes: "",
                  foodPairings: "",
                  productionNotes: "",
                  imageUpload: "",
                  criticReviews: "",
                  releaseDate: "",
                  price: "",
                  inventoryCount: "",
                },
              ],
            },
          }
        : prev
    );
  };
  const removeWineEntry = (index: number) => {
    setTenant((prev) => {
      if (!prev) return prev;
      const wineEntries = [...prev.cms.wineEntries];
      wineEntries.splice(index, 1);
      return { ...prev, cms: { ...prev.cms, wineEntries } };
    });
  };

  // --- Save/Delete ---
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
        await updateTenant(Number(id), tenant);
        toastSuccess("Tenant updated successfully");
      }
      setLocation("/somm-tenant-admin");
    } catch (error) {
      toastError(isNewTenant ? "Failed to create tenant" : "Failed to update tenant");
    }
  };

  const handleDelete = async () => {
    if (isNewTenant || !id) return;
    if (!window.confirm("Are you sure you want to delete this tenant? This action cannot be undone.")) return;
    try {
      await deleteTenant(Number(id));
      toastSuccess("Tenant deleted successfully");
      setLocation("/somm-tenant-admin");
    } catch (error) {
      toastError("Failed to delete tenant");
    }
  };

  // --- Dropdown actions ---
  const actions: ActionDropdownItem[] = [
    {
      label: "Delete Tenant",
      icon: <Trash2 size={16} />,
      onClick: handleDelete,
      colorClass: "text-red-400",
      disabled: false,
    },
  ];

  const pageTitle = isNewTenant ? "Add New Tenant" : "Edit Tenant";

  // Фільтровані вина для CMS табу
  const filteredWines = tenant?.cms.wineEntries.filter(wine =>
    wine.wineName.toLowerCase().includes(search.toLowerCase())
  ) || [];

  // Навігація до сторінки додавання вина
  const handleAddWine = () => {
    setLocation('/wine-edit/new');
  };

  // Навігація до сторінки редагування вина
  const handleEditWine = (wineIndex: number) => {
    setLocation(`/wine-edit/${wineIndex}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <AppHeader title={pageTitle} showBackButton onBack={() => setLocation("/somm-tenant-admin")} />
        <div className="pt-[75px] p-6">
          <div style={typography.body}>Loading tenant data...</div>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-black text-white">
        <AppHeader title={pageTitle} showBackButton onBack={() => setLocation("/somm-tenant-admin")} />
        <div className="pt-[75px] p-6">
          <div style={typography.body}>Tenant not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-600">
      <AppHeader
        title={pageTitle}
        showBackButton
        onBack={() => setLocation("/somm-tenant-admin")}
        rightContent={!isNewTenant && id ? <ActionDropdown actions={actions} /> : null}
      />
      <div className="pt-[75px] p-6">
        {/* Tabs */}
        <div className="flex mb-6">
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
          <div>
            {/* Profile fields */}
            {Object.entries(tenant.profile).map(([key, value]) => (
              <div key={key} className="mb-2">
                <label style={typography.body1R} className="block mb-1">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
                <input
                  type="text"
                  value={value}
                  onChange={e => handleProfileChange(key, e.target.value)}
                  className="w-full p-3 bg-white/5 border border-white/20 rounded-lg"
                  placeholder={key}
                />
              </div>
            ))}
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
          <div>
            {/* Wine club fields */}
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
          </div>
        )}
        {activeTab === 'ai' && (
          <div>
            {/* AI model fields */}
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
                value={tenant.aiModel.personalityStyle}
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
          </div>
        )}
        {/* Save Button */}
        <div className="pt-6">
          <Button
            variant="primary"
            onClick={handleSave}
            className="w-full"
          >
            {isNewTenant ? "Add Tenant" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TenantEdit; 