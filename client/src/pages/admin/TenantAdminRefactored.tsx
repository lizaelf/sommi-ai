import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useLocation, useRoute } from "wouter";
import { useStandardToast } from '@/components/ui/feedback/StandardToast';
import AppHeader, { HeaderSpacer } from "@/components/layout/AppHeader";
import { DataSyncManager } from "@/utils/dataSync";
import { Wine } from "@/types/wine";
import Button from "@/components/ui/buttons/Button";
import typography from "@/styles/typography";
import WineImage from "@/components/wine-details/WineImage";

// Refactored components
import { TabNavigation } from "@/components/admin/TabNavigation";
import { WineManagement } from "@/components/admin/WineManagement";
import AdminActionsDropdown from "@/components/admin/AdminActionsDropdown";

// Use unified wine data interface
type WineCardData = Wine;

interface TenantData {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  aiTone?: string;
  profile: {
    wineryName: string;
    wineryDescription: string;
    yearEstablished: string;
    wineryLogo: string;
    contactEmail: string;
    contactPhone: string;
    websiteURL: string;
    address: string;
    hoursOfOperation: string;
    socialMediaLinks: string;
  };
  cms: {
    wineEntries: Array<{
      wineName: string;
      vintageYear: string;
      sku: string;
      varietal: string;
      tastingNotes: string;
      foodPairings: string;
      productionNotes: string;
      imageUpload: string;
      criticReviews: string;
      releaseDate: string;
      price: string;
      inventoryCount: string;
    }>;
    wineClub: {
      clubName: string;
      description: string;
      membershipTiers: string;
      pricing: string;
      clubBenefits: string;
    };
  };
  aiModel: {
    knowledgeScope: "winery-only" | "winery-plus-global";
    personalityStyle:
      | "educator"
      | "sommelier"
      | "tasting-room-host"
      | "luxury-concierge"
      | "casual-friendly";
    brandGuide: string;
    tonePreferences: string;
    knowledgeDocuments: string;
  };
}

const TenantAdminRefactored: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"profile" | "cms" | "ai-model">(() => {
    // Restore tab from localStorage if available
    const savedTab = localStorage.getItem('tenantAdminActiveTab');
    return (savedTab as "profile" | "cms" | "ai-model") || "profile";
  });
  const { toastSuccess, toastError, toastInfo } = useStandardToast();
  const params = useParams();
  
  // Get tenant information
  const [currentTenant, setCurrentTenant] = useState<{name: string, slug: string} | null>(null);
  
  // Wine management state
  const [isEditMode, setIsEditMode] = useState(false);
  const [wineCards, setWineCards] = useState<WineCardData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(true);
  const [showDataSync, setShowDataSync] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();

  // Filter wines based on search term
  const filteredWines = useMemo(() => {
    if (!searchTerm) return wineCards;
    return wineCards.filter((wine: Wine) => 
      wine.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [wineCards, searchTerm]);
  
  const [formData, setFormData] = useState<TenantData>({
    id: 1,
    name: "Sample Winery",
    slug: "sample-winery",
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
  });

  useEffect(() => {
    // Extract tenant from URL or get stored tenants
    const storedTenants = localStorage.getItem('sommelier-tenants');
    if (storedTenants && params.tenantSlug) {
      const tenants = JSON.parse(storedTenants);
      const tenant = tenants.find((t: any) => t.slug === params.tenantSlug);
      if (tenant) {
        setCurrentTenant({ name: tenant.name, slug: tenant.slug });
      }
    }
  }, [params.tenantSlug]);

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('tenantAdminActiveTab', activeTab);
  }, [activeTab]);



  // Load wine data
  useEffect(() => {
    const loadWineData = async () => {
      try {
        const allWines = await DataSyncManager.getUnifiedWineData();
        setWineCards(allWines);
      } catch (error) {
        console.error("Error loading wine data:", error);
        toastError("Failed to load wine data");
      }
    };

    loadWineData();
  }, []);



  // Wine management handlers
  const handleToggleSearch = () => {
    setShowSearch(!showSearch);
  };

  const handleToggleDataSync = () => {
    setShowDataSync(!showDataSync);
  };

  const handleToggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const handleImportData = () => {
    fileInputRef.current?.click();
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(wineCards, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'wine-data.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAddWine = () => {
    console.log('Add wine clicked');
    // Navigate to wine edit page with "new" parameter for adding wines
    setLocation('/wine-edit/new');
  };

  const handleDeleteTenant = () => {
    if (currentTenant) {
      const confirmDelete = window.confirm(`Are you sure you want to delete "${currentTenant.name}"? This action cannot be undone.`);
      if (confirmDelete) {
        // Handle tenant deletion logic here
        toastSuccess(`Tenant "${currentTenant.name}" has been deleted`);
        // Navigate back to tenant list or home
        setLocation('/');
      }
    }
  };

  const handleEditWine = (wine: WineCardData) => {
    console.log('Edit wine clicked:', wine);
    // Navigate to the existing wine edit page
    setLocation(`/wine-edit/${wine.id}`);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="p-6 space-y-6">
            {/* First Row: Winery Name and Year Established */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label style={typography.body1R} className="block mb-2 text-white/80">
                  Winery Name
                </label>
                <input
                  type="text"
                  value={formData.profile.wineryName}
                  onChange={(e) => setFormData({
                    ...formData,
                    profile: { ...formData.profile, wineryName: e.target.value }
                  })}
                  className="w-full p-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
                  placeholder="Enter winery name"
                />
              </div>
              <div>
                <label style={typography.body1R} className="block mb-2 text-white/80">
                  Year Established
                </label>
                <input
                  type="text"
                  value={formData.profile.yearEstablished}
                  onChange={(e) => setFormData({
                    ...formData,
                    profile: { ...formData.profile, yearEstablished: e.target.value }
                  })}
                  className="w-full p-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
                  placeholder="e.g., 1985"
                />
              </div>
            </div>

            {/* Winery Description */}
            <div>
              <label style={typography.body1R} className="block mb-2 text-white/80">
                Winery Description
              </label>
              <textarea
                value={formData.profile.wineryDescription}
                onChange={(e) => setFormData({
                  ...formData,
                  profile: { ...formData.profile, wineryDescription: e.target.value }
                })}
                className="w-full p-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-white/40 focus:outline-none resize-none"
                placeholder="Describe your winery's history, philosophy, and unique characteristics"
                rows={4}
              />
            </div>

            {/* Second Row: Contact Email and Contact Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label style={typography.body1R} className="block mb-2 text-white/80">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={formData.profile.contactEmail}
                  onChange={(e) => setFormData({
                    ...formData,
                    profile: { ...formData.profile, contactEmail: e.target.value }
                  })}
                  className="w-full p-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
                  placeholder="contact@winery.com"
                />
              </div>
              <div>
                <label style={typography.body1R} className="block mb-2 text-white/80">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={formData.profile.contactPhone}
                  onChange={(e) => setFormData({
                    ...formData,
                    profile: { ...formData.profile, contactPhone: e.target.value }
                  })}
                  className="w-full p-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            {/* Website URL */}
            <div className="md:w-1/2">
              <label style={typography.body1R} className="block mb-2 text-white/80">
                Website URL
              </label>
              <input
                type="url"
                value={formData.profile.websiteURL}
                onChange={(e) => setFormData({
                  ...formData,
                  profile: { ...formData.profile, websiteURL: e.target.value }
                })}
                className="w-full p-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
                placeholder="https://www.winery.com"
              />
            </div>

            {/* Address */}
            <div>
              <label style={typography.body1R} className="block mb-2 text-white/80">
                Address
              </label>
              <textarea
                value={formData.profile.address}
                onChange={(e) => setFormData({
                  ...formData,
                  profile: { ...formData.profile, address: e.target.value }
                })}
                className="w-full p-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-white/40 focus:outline-none resize-none"
                placeholder="123 Vineyard Lane, Napa Valley, CA 94558"
                rows={2}
              />
            </div>

            {/* Fourth Row: Hours of Operation and Social Media Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label style={typography.body1R} className="block mb-2 text-white/80">
                  Hours of Operation
                </label>
                <textarea
                  value={formData.profile.hoursOfOperation}
                  onChange={(e) => setFormData({
                    ...formData,
                    profile: { ...formData.profile, hoursOfOperation: e.target.value }
                  })}
                  className="w-full p-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-white/40 focus:outline-none resize-none"
                  placeholder="Mon-Fri: 10am-6pm&#10;Sat-Sun: 10am-8pm"
                  rows={3}
                />
              </div>
              <div>
                <label style={typography.body1R} className="block mb-2 text-white/80">
                  Social Media Links
                </label>
                <textarea
                  value={formData.profile.socialMediaLinks}
                  onChange={(e) => setFormData({
                    ...formData,
                    profile: { ...formData.profile, socialMediaLinks: e.target.value }
                  })}
                  className="w-full p-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-white/40 focus:outline-none resize-none"
                  placeholder="Instagram: @winery&#10;Facebook: /winery&#10;Twitter: @winery"
                  rows={3}
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-6">
              <Button 
                variant="primary" 
                onClick={() => {
                  toastSuccess("Profile settings saved successfully");
                }}
                className="w-full md:w-auto"
              >
                Save Profile Settings
              </Button>
            </div>
          </div>
        );
      case "cms":
        return (
          <div className="p-6">
            {/* Search Bar and Add Wine Button */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search wines..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
                />
              </div>
              <Button 
                variant="primary" 
                onClick={() => setLocation('/wine-edit/new')}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <span className="text-lg">+</span>
                Add wine
              </Button>
            </div>

            {/* Wine Grid */}
            <div className="space-y-4">
              {filteredWines.map((wine) => (
                <div 
                  key={wine.id} 
                  className="flex items-center gap-4 p-4 bg-white/5 border border-white/20 rounded-lg hover:bg-white/8 transition-colors cursor-pointer"
                  onClick={() => handleEditWine(wine)}
                >
                  {/* Wine Image */}
                  <div className="w-16 h-20 flex-shrink-0">
                    <WineImage
                      wineName={wine.name}
                      alt={wine.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  
                  {/* Wine Info */}
                  <div className="flex-1">
                    <h3 style={typography.buttonPlus1} className="text-white mb-1">
                      {wine.name}
                    </h3>
                    <p style={typography.body1R} className="text-white/60">
                      ID: {wine.id}
                    </p>
                  </div>
                </div>
              ))}

              {filteredWines.length === 0 && (
                <div className="text-center py-12">
                  <p style={typography.body1R} className="text-white/60">
                    {searchTerm ? 'No wines found matching your search.' : 'No wines available. Add your first wine to get started.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      case "ai-model":
        return (
          <div className="p-6 space-y-6">
            {/* First Row: Knowledge Scope and Personality Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label style={typography.body1R} className="block mb-2 text-white/80">
                  Knowledge Scope
                </label>
                <select
                  value={formData.aiModel.knowledgeScope}
                  onChange={(e) => {
                    const value = e.target.value as "winery-only" | "winery-plus-global";
                    setFormData({
                      ...formData,
                      aiModel: { ...formData.aiModel, knowledgeScope: value }
                    });
                  }}
                  className="w-full p-4 bg-white/5 border border-white/20 rounded-lg text-white focus:border-white/40 focus:outline-none"
                >
                  <option value="winery-only">Winery Only</option>
                  <option value="winery-plus-global">Winery Plus Global</option>
                </select>
              </div>
              <div>
                <label style={typography.body1R} className="block mb-2 text-white/80">
                  Personality Style
                </label>
                <select
                  value={formData.aiModel.personalityStyle}
                  onChange={(e) => {
                    const value = e.target.value as "educator" | "sommelier" | "tasting-room-host" | "luxury-concierge" | "casual-friendly";
                    setFormData({
                      ...formData,
                      aiModel: { ...formData.aiModel, personalityStyle: value }
                    });
                  }}
                  className="w-full p-4 bg-white/5 border border-white/20 rounded-lg text-white focus:border-white/40 focus:outline-none"
                >
                  <option value="sommelier">Sommelier</option>
                  <option value="educator">Educator</option>
                  <option value="tasting-room-host">Tasting Room Host</option>
                  <option value="luxury-concierge">Luxury Concierge</option>
                  <option value="casual-friendly">Casual Friendly</option>
                </select>
              </div>
            </div>

            {/* Brand Guide */}
            <div>
              <label style={typography.body1R} className="block mb-2 text-white/80">
                Brand Guide
              </label>
              <textarea
                value={formData.aiModel.brandGuide}
                onChange={(e) => setFormData({
                  ...formData,
                  aiModel: { ...formData.aiModel, brandGuide: e.target.value }
                })}
                className="w-full p-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-white/40 focus:outline-none resize-none"
                placeholder="Define your brand voice, values, and key messaging guidelines that the AI should follow when representing your winery"
                rows={4}
              />
            </div>

            {/* Tone Preferences */}
            <div>
              <label style={typography.body1R} className="block mb-2 text-white/80">
                Tone Preferences
              </label>
              <textarea
                value={formData.aiModel.tonePreferences}
                onChange={(e) => setFormData({
                  ...formData,
                  aiModel: { ...formData.aiModel, tonePreferences: e.target.value }
                })}
                className="w-full p-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-white/40 focus:outline-none resize-none"
                placeholder="Specify the desired tone: formal, casual, educational, enthusiastic, etc. Include any specific language preferences or communication style guidelines"
                rows={4}
              />
            </div>

            {/* Knowledge Documents */}
            <div>
              <label style={typography.body1R} className="block mb-2 text-white/80">
                Knowledge Documents
              </label>
              <div className="space-y-3">
                <div 
                  className="w-full p-4 bg-white/5 border border-white/20 rounded-lg text-white/60 cursor-pointer hover:bg-white/8 transition-colors flex items-center justify-center"
                  onClick={() => {
                    // Handle file upload
                    toastInfo("Document upload functionality coming soon");
                  }}
                >
                  <span>Click to upload documents</span>
                </div>
                <textarea
                  value={formData.aiModel.knowledgeDocuments}
                  onChange={(e) => setFormData({
                    ...formData,
                    aiModel: { ...formData.aiModel, knowledgeDocuments: e.target.value }
                  })}
                  className="w-full p-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-white/40 focus:outline-none resize-none"
                  placeholder="List uploaded knowledge documents or paste additional context about your wines, history, and expertise"
                  rows={3}
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-6">
              <Button 
                variant="primary" 
                onClick={() => {
                  toastSuccess("AI Model settings saved successfully");
                }}
                className="w-full md:w-auto"
              >
                Save AI Model Settings
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white mx-auto" style={{ maxWidth: "1200px" }}>
      <AppHeader
        title={currentTenant?.name || "Admin Panel"}
        showBackButton={true}
        rightContent={
          <AdminActionsDropdown onDeleteTenant={handleDeleteTenant} />
        }
      />
      <HeaderSpacer />

      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {renderTabContent()}
    </div>
  );
};

export default TenantAdminRefactored;