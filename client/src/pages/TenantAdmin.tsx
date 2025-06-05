import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Upload, Download, Search, X, RefreshCw, User, LogOut, Settings, Menu, Plus } from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { SegmentedPicker } from "@/components/SegmentedPicker";
import Button from "@/components/ui/Button";
import typography from "@/styles/typography";
import { generateWineQRData } from "@/utils/cellarManager";
import { SimpleQRCode } from "@/components/SimpleQRCode";
import { DataSyncManager, type UnifiedWineData } from "@/utils/dataSync";
import placeholderImage from "@assets/Placeholder.png";

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
  const { toast } = useToast();
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
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
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
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 bg-black z-50 border-b border-white/10">
        <div className="max-w-6xl mx-auto p-6">
          {/* Title */}
          <div className="mb-3 flex items-center justify-between">
            <button 
              onClick={() => setLocation('/somm-tenant-admin')}
              className="tertiary-button flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 
              className="text-white text-[18px] font-medium"
              style={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)"
              }}
            >{currentTenant?.name || formData.profile.wineryName || "Enter Winery Name"}</h1>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const newId = wineCards.length > 0 ? Math.max(...wineCards.map(w => w.id)) + 1 : 1;
                  setLocation(`/wine-edit/${newId}?new=true`);
                }}
                className="tertiary-button flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-colors"
              >
                <Plus className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>



          {/* Search - Only show when on CMS tab */}
          {activeTab === "cms" && (
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search wines..."
                  className="contact-form-input"
                  style={{
                    color: "white !important",
                    height: "56px",
                    width: "100%",
                    fontSize: "16px",
                    fontWeight: "400",
                    paddingLeft: "40px",
                    paddingRight: "40px",
                  }}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

            </div>
          )}
        </div>
      </div>

      {/* SegmentedPicker under header */}
      <div className="fixed top-0 left-0 right-0 z-40" style={{ top: activeTab === "cms" ? "156px" : "100px" }}>
        <div className="bg-black/90 backdrop-blur-sm border-b border-white/10 p-4">
          <div className="max-w-6xl mx-auto">
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
        </div>
      </div>

      {/* Content with top and bottom padding to account for fixed header and tabs */}
      <div style={{ 
        paddingTop: activeTab === "cms" ? "220px" : "164px",
        paddingBottom: "40px"
      }}>
        <div className="max-w-6xl mx-auto p-6">
          {/* Content */}
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4 text-white">
                Profile Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">
                    Winery Name
                  </label>
                  <input
                    type="text"
                    value={formData.profile.wineryName}
                    onChange={(e) =>
                      handleInputChange("profile", "wineryName", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter winery name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">
                    Year Established
                  </label>
                  <input
                    type="text"
                    value={formData.profile.yearEstablished}
                    onChange={(e) =>
                      handleInputChange(
                        "profile",
                        "yearEstablished",
                        e.target.value,
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 1885"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2 text-white">
                    Winery Description
                  </label>
                  <textarea
                    value={formData.profile.wineryDescription}
                    onChange={(e) =>
                      handleInputChange(
                        "profile",
                        "wineryDescription",
                        e.target.value,
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the winery..."
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">
                    Winery Logo (Upload)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleFileUpload("profile", "wineryLogo", e)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={formData.profile.contactEmail}
                    onChange={(e) =>
                      handleInputChange(
                        "profile",
                        "contactEmail",
                        e.target.value,
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="contact@winery.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.profile.contactPhone}
                    onChange={(e) =>
                      handleInputChange(
                        "profile",
                        "contactPhone",
                        e.target.value,
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={formData.profile.websiteURL}
                    onChange={(e) =>
                      handleInputChange("profile", "websiteURL", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://www.winery.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2 text-white">
                    Address
                  </label>
                  <textarea
                    value={formData.profile.address}
                    onChange={(e) =>
                      handleInputChange("profile", "address", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123 Wine Street, Napa Valley, CA 94558"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">
                    Hours of Operation
                  </label>
                  <textarea
                    value={formData.profile.hoursOfOperation}
                    onChange={(e) =>
                      handleInputChange(
                        "profile",
                        "hoursOfOperation",
                        e.target.value,
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Mon-Sat: 10am-6pm, Sun: 11am-5pm"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">
                    Social Media Links
                  </label>
                  <textarea
                    value={formData.profile.socialMediaLinks}
                    onChange={(e) =>
                      handleInputChange(
                        "profile",
                        "socialMediaLinks",
                        e.target.value,
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Instagram: @winery, Facebook: /winery"
                    rows={2}
                  />
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocation(`/wine-edit/${wine.id}`);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded text-xs"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete ${wine.name}?`)) {
                                toast({
                                  title: "Wine deleted",
                                  description: `${wine.name} has been removed`,
                                });
                              }
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white p-1 rounded text-xs"
                          >
                            Delete
                          </button>
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
              <h2 className="text-xl font-semibold mb-4 text-white">AI Model Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">
                    Knowledge Scope
                  </label>
                  <select
                    value={formData.aiModel.knowledgeScope}
                    onChange={(e) =>
                      handleInputChange(
                        "aiModel",
                        "knowledgeScope",
                        e.target.value,
                      )
                    }
                    className="contact-form-input"
                    style={{
                      color: "white !important",
                      height: "56px",
                      width: "100%",
                      fontSize: "16px",
                      fontWeight: "400",
                      padding: "0 16px",
                    }}
                  >
                    <option value="winery-only">Winery Only</option>
                    <option value="winery-plus-global">
                      Winery + Global Wine Knowledge
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">
                    Personality Style
                  </label>
                  <select
                    value={formData.aiModel.personalityStyle}
                    onChange={(e) =>
                      handleInputChange(
                        "aiModel",
                        "personalityStyle",
                        e.target.value,
                      )
                    }
                    className="contact-form-input"
                    style={{
                      color: "white !important",
                      height: "56px",
                      width: "100%",
                      fontSize: "16px",
                      fontWeight: "400",
                      padding: "0 16px",
                    }}
                  >
                    <option value="educator">Educator</option>
                    <option value="sommelier">Sommelier</option>
                    <option value="tasting-room-host">Tasting Room Host</option>
                    <option value="luxury-concierge">Luxury Concierge</option>
                    <option value="casual-friendly">Casual Friendly</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2 text-white">
                    Brand Guide
                  </label>
                  <textarea
                    value={formData.aiModel.brandGuide}
                    onChange={(e) =>
                      handleInputChange("aiModel", "brandGuide", e.target.value)
                    }
                    className="contact-form-input"
                    style={{
                      color: "white !important",
                      minHeight: "120px",
                      width: "100%",
                      fontSize: "16px",
                      fontWeight: "400",
                      padding: "16px",
                      resize: "vertical",
                    }}
                    placeholder="Define the brand voice and messaging guidelines..."
                    rows={4}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2 text-white">
                    Tone Preferences
                  </label>
                  <textarea
                    value={formData.aiModel.tonePreferences}
                    onChange={(e) =>
                      handleInputChange(
                        "aiModel",
                        "tonePreferences",
                        e.target.value,
                      )
                    }
                    className="contact-form-input"
                    style={{
                      color: "white !important",
                      minHeight: "96px",
                      width: "100%",
                      fontSize: "16px",
                      fontWeight: "400",
                      padding: "16px",
                      resize: "vertical",
                    }}
                    placeholder="Professional, friendly, conversational..."
                    rows={3}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2 text-white">
                    Knowledge Documents (Upload)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    multiple
                    onChange={(e) =>
                      handleFileUpload("aiModel", "knowledgeDocuments", e)
                    }
                    className="contact-form-input"
                    style={{
                      color: "white !important",
                      height: "56px",
                      width: "100%",
                      fontSize: "16px",
                      fontWeight: "400",
                      padding: "0 16px",
                    }}
                  />
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