import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Upload, Download, Search, X, RefreshCw, User, LogOut, Settings, Menu, Plus } from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { useStandardToast } from "@/components/ui/feedback/StandardToast";
import { SegmentedPicker } from "@/components/SegmentedPicker";
import Button from "@/components/ui/buttons/Button";
import typography from "@/styles/typography";
import { generateWineQRData } from "@/utils/cellarManager";
import { SimpleQRCode } from "@/components/qr/SimpleQRCode";
import { DataSyncManager, type UnifiedWineData } from "@/utils/dataSync";
import placeholderImage from "@assets/Placeholder.png";
import AppHeader from "@/components/layout/AppHeader";

// Use unified wine data interface
type WineCardData = UnifiedWineData;

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

const TenantAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"profile" | "cms" | "ai-model">(() => {
    // Restore tab from localStorage if available
    const savedTab = localStorage.getItem('tenantAdminActiveTab');
    return (savedTab as "profile" | "cms" | "ai-model") || "profile";
  });
  const { toastSuccess, toastError, toastInfo } = useStandardToast();
  const [, setLocation] = useLocation();
  const params = useParams();
  
  // Get tenant information
  const [currentTenant, setCurrentTenant] = useState<{name: string, slug: string} | null>(null);
  
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

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle logout
  const handleLogout = () => {
    // Clear any stored user data
    localStorage.removeItem('userToken');
    localStorage.removeItem('tenantAdminActiveTab');
    toastSuccess("You have been successfully logged out", "Logged out");
    // Navigate to login page or home
    setLocation('/');
  };

  // Handle edit profile
  const handleEditProfile = () => {
    setActiveTab('profile');
    setShowUserDropdown(false);
  };
  
  // Wine management state
  const [isEditMode, setIsEditMode] = useState(false);
  const [wineCards, setWineCards] = useState<WineCardData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(true);
  const [showDataSync, setShowDataSync] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
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
      wineEntries: [
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

  const queryClient = useQueryClient();

  // Load tenant data from localStorage
  const { data: tenant, isLoading } = useQuery({
    queryKey: ["tenant-admin", 1],
    queryFn: () => {
      const stored = localStorage.getItem("tenant-admin-1");
      if (stored) {
        const data = JSON.parse(stored);
        setFormData(data);
        return data;
      }
      return formData;
    },
  });

  // Save tenant data mutation
  const saveTenantMutation = useMutation({
    mutationFn: async (data: TenantData) => {
      localStorage.setItem("tenant-admin-1", JSON.stringify(data));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-admin", 1] });
      alert("Data saved successfully");
    },
  });

  const handleSave = () => {
    saveTenantMutation.mutate(formData);
  };

  // Load wine data on mount
  useEffect(() => {
    loadWineData();
  }, []);

  // Refresh wine data when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadWineData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Function to load wine data
  const loadWineData = () => {
    DataSyncManager.initialize();
    const allWines = DataSyncManager.getUnifiedWineData();
    console.log("Loaded CMS wines:", allWines);
    setWineCards(allWines);
  };

  const handleInputChange = (
    section: keyof TenantData,
    field: string,
    value: string,
  ) => {
    setFormData((prev) => {
      const sectionData = prev[section];
      if (typeof sectionData === "object" && sectionData !== null) {
        return {
          ...prev,
          [section]: {
            ...sectionData,
            [field]: value,
          },
        };
      }
      return prev;
    });
  };

  const handleWineClubChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      cms: {
        ...prev.cms,
        wineClub: {
          ...prev.cms.wineClub,
          [field]: value,
        },
      },
    }));
  };

  const handleWineEntryChange = (
    index: number,
    field: string,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      cms: {
        ...prev.cms,
        wineEntries: prev.cms.wineEntries.map((entry, i) =>
          i === index ? { ...entry, [field]: value } : entry,
        ),
      },
    }));
  };

  const addWineEntry = () => {
    setFormData((prev) => ({
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
    }));
  };

  const handleFileUpload = (
    section: string,
    field: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (section === "profile") {
          handleInputChange("profile" as keyof TenantData, field, result);
        } else if (section === "aiModel") {
          handleInputChange("aiModel" as keyof TenantData, field, result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading tenant admin...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 mobile-fullscreen">
      <AppHeader 
        title={currentTenant?.name || formData.profile.wineryName || "Winery Name"}
        showBackButton={true}
        onBack={() => setLocation('/somm-tenant-admin')}
        className="z-[60]"
      />
      
      <div className="fixed top-[75px] left-0 right-0 bg-black z-[59] border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 pb-4">
          {/* SegmentedPicker */}
          <div className="border-b border-white/10 pb-3">
            <SegmentedPicker
              options={[
                { value: "profile", label: "Profile" },
                { value: "cms", label: "CMS" },
                { value: "ai-model", label: "AI Model" }
              ]}
              value={activeTab}
              onChange={(value) => setActiveTab(value as "profile" | "cms" | "ai-model")}
            />
          </div>

          {/* Search and Add Wine - Only show when on CMS tab */}
          {activeTab === "cms" && (
            <div className="flex items-center gap-3 mt-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search wines..."
                  style={{
                    color: "white",
                    height: "56px",
                    width: "100%",
                    fontSize: "16px",
                    fontWeight: "400",
                    paddingLeft: "40px",
                    paddingRight: "40px",
                    boxSizing: "border-box",
                    borderRadius: "12px",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    background: "transparent",
                    fontFamily: "Inter, sans-serif",
                    outline: "none",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(255, 255, 255, 0.3)";
                    e.target.style.background = "transparent";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255, 255, 255, 0.12)";
                    e.target.style.background = "transparent";
                  }}
                />
                {searchTerm && (
                  <Button
                    onClick={() => setSearchTerm("")}
                    variant="secondary"
                    size="iconSm"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <Button
                onClick={() => {
                  // Create new wine with next available ID
                  const nextId = Math.max(...wineCards.map(w => w.id), 0) + 1;
                  setLocation(`/wine-edit/${nextId}?new=true`);
                }}
                variant="primary"
                size="lg"
                className="px-4 flex-shrink-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add wine
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content with top and bottom padding to account for fixed header */}
      <div style={{ 
        paddingTop: activeTab === "cms" ? "163px" : "107px",
        paddingBottom: "40px"
      }}>
        <div className="max-w-6xl mx-auto p-6">
          {/* Content */}
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Winery Name */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-sm font-medium text-white/60 mb-2">Winery Name</h3>
                  {editingField === "wineryName" ? (
                    <input
                      type="text"
                      value={formData.profile.wineryName}
                      onChange={(e) => handleInputChange("profile", "wineryName", e.target.value)}
                      onBlur={() => setEditingField(null)}
                      onKeyDown={(e) => e.key === "Enter" && setEditingField(null)}
                      className="contact-form-input"
                      style={{
                        color: "white !important",
                        height: "40px",
                        width: "100%",
                        fontSize: "16px",
                        fontWeight: "400",
                        padding: "0 12px",
                      }}
                      placeholder="Enter winery name"
                      autoFocus
                    />
                  ) : (
                    <p 
                      className="text-white text-base cursor-pointer hover:bg-white/10 p-2 rounded"
                      onClick={() => setEditingField("wineryName")}
                    >
                      {formData.profile.wineryName || "-"}
                    </p>
                  )}
                </div>

                {/* Year Established */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-sm font-medium text-white/60 mb-2">Year Established</h3>
                  {editingField === "yearEstablished" ? (
                    <input
                      type="text"
                      value={formData.profile.yearEstablished}
                      onChange={(e) => handleInputChange("profile", "yearEstablished", e.target.value)}
                      onBlur={() => setEditingField(null)}
                      onKeyDown={(e) => e.key === "Enter" && setEditingField(null)}
                      className="contact-form-input"
                      style={{
                        color: "white !important",
                        height: "40px",
                        width: "100%",
                        fontSize: "16px",
                        fontWeight: "400",
                        padding: "0 12px",
                      }}
                      placeholder="e.g., 1885"
                      autoFocus
                    />
                  ) : (
                    <p 
                      className="text-white text-base cursor-pointer hover:bg-white/10 p-2 rounded"
                      onClick={() => setEditingField("yearEstablished")}
                    >
                      {formData.profile.yearEstablished || "-"}
                    </p>
                  )}
                </div>

                {/* Winery Description */}
                <div className="md:col-span-2 bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-sm font-medium text-white/60 mb-2">Winery Description</h3>
                  {editingField === "wineryDescription" ? (
                    <textarea
                      value={formData.profile.wineryDescription}
                      onChange={(e) => handleInputChange("profile", "wineryDescription", e.target.value)}
                      onBlur={() => setEditingField(null)}
                      className="contact-form-input"
                      style={{
                        color: "white !important",
                        minHeight: "100px",
                        width: "100%",
                        fontSize: "16px",
                        fontWeight: "400",
                        padding: "12px",
                        resize: "vertical",
                      }}
                      placeholder="Describe the winery..."
                      rows={3}
                      autoFocus
                    />
                  ) : (
                    <p 
                      className="text-white text-base cursor-pointer hover:bg-white/10 p-2 rounded min-h-[60px]"
                      onClick={() => setEditingField("wineryDescription")}
                    >
                      {formData.profile.wineryDescription || "-"}
                    </p>
                  )}
                </div>

                {/* Contact Email */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-sm font-medium text-white/60 mb-2">Contact Email</h3>
                  {editingField === "contactEmail" ? (
                    <input
                      type="email"
                      value={formData.profile.contactEmail}
                      onChange={(e) => handleInputChange("profile", "contactEmail", e.target.value)}
                      onBlur={() => setEditingField(null)}
                      onKeyDown={(e) => e.key === "Enter" && setEditingField(null)}
                      className="contact-form-input"
                      style={{
                        color: "white !important",
                        height: "40px",
                        width: "100%",
                        fontSize: "16px",
                        fontWeight: "400",
                        padding: "0 12px",
                      }}
                      placeholder="contact@winery.com"
                      autoFocus
                    />
                  ) : (
                    <p 
                      className="text-white text-base cursor-pointer hover:bg-white/10 p-2 rounded"
                      onClick={() => setEditingField("contactEmail")}
                    >
                      {formData.profile.contactEmail || "-"}
                    </p>
                  )}
                </div>

                {/* Contact Phone */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-sm font-medium text-white/60 mb-2">Contact Phone</h3>
                  {editingField === "contactPhone" ? (
                    <input
                      type="tel"
                      value={formData.profile.contactPhone}
                      onChange={(e) => handleInputChange("profile", "contactPhone", e.target.value)}
                      onBlur={() => setEditingField(null)}
                      onKeyDown={(e) => e.key === "Enter" && setEditingField(null)}
                      className="contact-form-input"
                      style={{
                        color: "white !important",
                        height: "40px",
                        width: "100%",
                        fontSize: "16px",
                        fontWeight: "400",
                        padding: "0 12px",
                      }}
                      placeholder="+1 (555) 123-4567"
                      autoFocus
                    />
                  ) : (
                    <p 
                      className="text-white text-base cursor-pointer hover:bg-white/10 p-2 rounded"
                      onClick={() => setEditingField("contactPhone")}
                    >
                      {formData.profile.contactPhone || "-"}
                    </p>
                  )}
                </div>

                {/* Website URL */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-sm font-medium text-white/60 mb-2">Website URL</h3>
                  {editingField === "websiteURL" ? (
                    <input
                      type="url"
                      value={formData.profile.websiteURL}
                      onChange={(e) => handleInputChange("profile", "websiteURL", e.target.value)}
                      onBlur={() => setEditingField(null)}
                      onKeyDown={(e) => e.key === "Enter" && setEditingField(null)}
                      className="contact-form-input"
                      style={{
                        color: "white !important",
                        height: "40px",
                        width: "100%",
                        fontSize: "16px",
                        fontWeight: "400",
                        padding: "0 12px",
                      }}
                      placeholder="https://www.winery.com"
                      autoFocus
                    />
                  ) : (
                    <p 
                      className="text-white text-base cursor-pointer hover:bg-white/10 p-2 rounded"
                      onClick={() => setEditingField("websiteURL")}
                    >
                      {formData.profile.websiteURL || "-"}
                    </p>
                  )}
                </div>

                {/* Address */}
                <div className="md:col-span-2 bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-sm font-medium text-white/60 mb-2">Address</h3>
                  {editingField === "address" ? (
                    <textarea
                      value={formData.profile.address}
                      onChange={(e) => handleInputChange("profile", "address", e.target.value)}
                      onBlur={() => setEditingField(null)}
                      className="contact-form-input"
                      style={{
                        color: "white !important",
                        minHeight: "80px",
                        width: "100%",
                        fontSize: "16px",
                        fontWeight: "400",
                        padding: "12px",
                        resize: "vertical",
                      }}
                      placeholder="123 Wine Street, Napa Valley, CA 94558"
                      rows={2}
                      autoFocus
                    />
                  ) : (
                    <p 
                      className="text-white text-base cursor-pointer hover:bg-white/10 p-2 rounded min-h-[50px]"
                      onClick={() => setEditingField("address")}
                    >
                      {formData.profile.address || "-"}
                    </p>
                  )}
                </div>

                {/* Hours of Operation */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-sm font-medium text-white/60 mb-2">Hours of Operation</h3>
                  {editingField === "hoursOfOperation" ? (
                    <textarea
                      value={formData.profile.hoursOfOperation}
                      onChange={(e) => handleInputChange("profile", "hoursOfOperation", e.target.value)}
                      onBlur={() => setEditingField(null)}
                      className="contact-form-input"
                      style={{
                        color: "white !important",
                        minHeight: "80px",
                        width: "100%",
                        fontSize: "16px",
                        fontWeight: "400",
                        padding: "12px",
                        resize: "vertical",
                      }}
                      placeholder="Mon-Sat: 10am-6pm, Sun: 11am-5pm"
                      rows={2}
                      autoFocus
                    />
                  ) : (
                    <p 
                      className="text-white text-base cursor-pointer hover:bg-white/10 p-2 rounded min-h-[50px]"
                      onClick={() => setEditingField("hoursOfOperation")}
                    >
                      {formData.profile.hoursOfOperation || "-"}
                    </p>
                  )}
                </div>

                {/* Social Media Links */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-sm font-medium text-white/60 mb-2">Social Media Links</h3>
                  {editingField === "socialMediaLinks" ? (
                    <textarea
                      value={formData.profile.socialMediaLinks}
                      onChange={(e) => handleInputChange("profile", "socialMediaLinks", e.target.value)}
                      onBlur={() => setEditingField(null)}
                      className="contact-form-input"
                      style={{
                        color: "white !important",
                        minHeight: "80px",
                        width: "100%",
                        fontSize: "16px",
                        fontWeight: "400",
                        padding: "12px",
                        resize: "vertical",
                      }}
                      placeholder="Instagram: @winery, Facebook: /winery"
                      rows={2}
                      autoFocus
                    />
                  ) : (
                    <p 
                      className="text-white text-base cursor-pointer hover:bg-white/10 p-2 rounded min-h-[50px]"
                      onClick={() => setEditingField("socialMediaLinks")}
                    >
                      {formData.profile.socialMediaLinks || "-"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CMS Tab - Wine Management */}
          {activeTab === "cms" && (
            <div style={{ backgroundColor: "#000000", minHeight: "100vh" }}>
              {/* Wine Cards List */}
              <div>
                <div className="divide-y divide-white/20">
                  {wineCards
                    .filter(wine => wine.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((wine) => (
                    <div
                      key={wine.id}
                      className="relative p-4 hover:bg-white/5 transition-all cursor-pointer flex items-start gap-4"
                      onClick={() => setLocation(`/wine-edit/${wine.id}`)}
                    >
                      {/* Wine Image - Left Side */}
                      <div className="w-[112px] h-[150px] rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={wine.image || placeholderImage}
                          alt={wine.name}
                          className="w-full h-full object-contain"
                          onLoad={() => console.log(`CMS image loaded: ${wine.name}`)}
                          onError={(e) => {
                            console.log(`CMS placeholder loaded for: ${wine.name}`);
                            (e.target as HTMLImageElement).src = placeholderImage;
                          }}
                        />
                      </div>

                      {/* Wine Details - Right Side */}
                      <div className="flex-1 pt-2">
                        <h3 className="text-white font-medium text-lg leading-tight mb-1">
                          {wine.name}
                        </h3>
                        <p className="text-white/50 text-sm">
                          ID: {wine.id}
                        </p>
                      </div>

                      {/* Edit Mode Controls */}
                      {isEditMode && (
                        <div className="absolute top-2 right-2 flex gap-1">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocation(`/wine-edit/${wine.id}`);
                            }}
                            variant="primary"
                            size="sm"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete ${wine.name}?`)) {
                                toastSuccess(`${wine.name, "Wine deleted");
                              }
                            }}
                            variant="error"
                            size="sm"
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* AI Model Tab */}
          {activeTab === "ai-model" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Knowledge Scope */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-sm font-medium text-white/60 mb-2">Knowledge Scope</h3>
                  {editingField === "knowledgeScope" ? (
                    <select
                      value={formData.aiModel.knowledgeScope}
                      onChange={(e) => handleInputChange("aiModel", "knowledgeScope", e.target.value)}
                      onBlur={() => setEditingField(null)}
                      className="contact-form-input"
                      style={{
                        color: "white !important",
                        height: "40px",
                        width: "100%",
                        fontSize: "16px",
                        fontWeight: "400",
                        padding: "0 12px",
                      }}
                      autoFocus
                    >
                      <option value="winery-only">Winery Only</option>
                      <option value="winery-plus-global">Winery + Global Wine Knowledge</option>
                    </select>
                  ) : (
                    <p 
                      className="text-white text-base cursor-pointer hover:bg-white/10 p-2 rounded"
                      onClick={() => setEditingField("knowledgeScope")}
                    >
                      {formData.aiModel.knowledgeScope === "winery-only" ? "Winery Only" : "Winery + Global Wine Knowledge"}
                    </p>
                  )}
                </div>

                {/* Personality Style */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-sm font-medium text-white/60 mb-2">Personality Style</h3>
                  {editingField === "personalityStyle" ? (
                    <select
                      value={formData.aiModel.personalityStyle}
                      onChange={(e) => handleInputChange("aiModel", "personalityStyle", e.target.value)}
                      onBlur={() => setEditingField(null)}
                      className="contact-form-input"
                      style={{
                        color: "white !important",
                        height: "40px",
                        width: "100%",
                        fontSize: "16px",
                        fontWeight: "400",
                        padding: "0 12px",
                      }}
                      autoFocus
                    >
                      <option value="educator">Educator</option>
                      <option value="sommelier">Sommelier</option>
                      <option value="tasting-room-host">Tasting Room Host</option>
                      <option value="luxury-concierge">Luxury Concierge</option>
                      <option value="casual-friendly">Casual Friendly</option>
                    </select>
                  ) : (
                    <p 
                      className="text-white text-base cursor-pointer hover:bg-white/10 p-2 rounded"
                      onClick={() => setEditingField("personalityStyle")}
                    >
                      {formData.aiModel.personalityStyle === "educator" ? "Educator" :
                       formData.aiModel.personalityStyle === "sommelier" ? "Sommelier" :
                       formData.aiModel.personalityStyle === "tasting-room-host" ? "Tasting Room Host" :
                       formData.aiModel.personalityStyle === "luxury-concierge" ? "Luxury Concierge" :
                       formData.aiModel.personalityStyle === "casual-friendly" ? "Casual Friendly" : "-"}
                    </p>
                  )}
                </div>

                {/* Brand Guide */}
                <div className="md:col-span-2 bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-sm font-medium text-white/60 mb-2">Brand Guide</h3>
                  {editingField === "brandGuide" ? (
                    <textarea
                      value={formData.aiModel.brandGuide}
                      onChange={(e) => handleInputChange("aiModel", "brandGuide", e.target.value)}
                      onBlur={() => setEditingField(null)}
                      className="contact-form-input"
                      style={{
                        color: "white !important",
                        minHeight: "100px",
                        width: "100%",
                        fontSize: "16px",
                        fontWeight: "400",
                        padding: "12px",
                        resize: "vertical",
                      }}
                      placeholder="Define the brand voice and messaging guidelines..."
                      rows={3}
                      autoFocus
                    />
                  ) : (
                    <p 
                      className="text-white text-base cursor-pointer hover:bg-white/10 p-2 rounded min-h-[60px]"
                      onClick={() => setEditingField("brandGuide")}
                    >
                      {formData.aiModel.brandGuide || "-"}
                    </p>
                  )}
                </div>

                {/* Tone Preferences */}
                <div className="md:col-span-2 bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-sm font-medium text-white/60 mb-2">Tone Preferences</h3>
                  {editingField === "tonePreferences" ? (
                    <textarea
                      value={formData.aiModel.tonePreferences}
                      onChange={(e) => handleInputChange("aiModel", "tonePreferences", e.target.value)}
                      onBlur={() => setEditingField(null)}
                      className="contact-form-input"
                      style={{
                        color: "white !important",
                        minHeight: "80px",
                        width: "100%",
                        fontSize: "16px",
                        fontWeight: "400",
                        padding: "12px",
                        resize: "vertical",
                      }}
                      placeholder="Professional, friendly, conversational..."
                      rows={2}
                      autoFocus
                    />
                  ) : (
                    <p 
                      className="text-white text-base cursor-pointer hover:bg-white/10 p-2 rounded min-h-[50px]"
                      onClick={() => setEditingField("tonePreferences")}
                    >
                      {formData.aiModel.tonePreferences || "-"}
                    </p>
                  )}
                </div>

                {/* Knowledge Documents */}
                <div className="md:col-span-2 bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-sm font-medium text-white/60 mb-2">Knowledge Documents</h3>
                  {editingField === "knowledgeDocuments" ? (
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      multiple
                      onChange={(e) => {
                        handleFileUpload("aiModel", "knowledgeDocuments", e);
                        setEditingField(null);
                      }}
                      onBlur={() => setEditingField(null)}
                      className="contact-form-input"
                      style={{
                        color: "white !important",
                        height: "40px",
                        width: "100%",
                        fontSize: "16px",
                        fontWeight: "400",
                        padding: "0 12px",
                      }}
                      autoFocus
                    />
                  ) : (
                    <p 
                      className="text-white text-base cursor-pointer hover:bg-white/10 p-2 rounded"
                      onClick={() => setEditingField("knowledgeDocuments")}
                    >
                      {formData.aiModel.knowledgeDocuments || "Click to upload documents"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default TenantAdmin;