import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Upload, Download, Search, X, RefreshCw } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
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
  const [activeTab, setActiveTab] = useState<"profile" | "cms" | "ai-model">(
    "profile",
  );
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Wine management state
  const [isEditMode, setIsEditMode] = useState(false);
  const [wineCards, setWineCards] = useState<WineCardData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(true);
  const [showDataSync, setShowDataSync] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  // Load tenant data query
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
        wineEntries: prev.cms.wineEntries.map((wine, i) =>
          i === index ? { ...wine, [field]: value } : wine,
        ),
      },
    }));
  };

  const handleWineImageUpload = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        handleWineEntryChange(index, "imageUpload", result);
      };
      reader.readAsDataURL(file);
    }
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Tenant Admin</h1>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-8">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === "profile"
                ? "bg-green-500 text-white"
                : "bg-gray-300 text-gray-700 hover:bg-gray-400"
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab("cms")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === "cms"
                ? "bg-green-500 text-white"
                : "bg-gray-300 text-gray-700 hover:bg-gray-400"
            }`}
          >
            CMS
          </button>
          <button
            onClick={() => setActiveTab("ai-model")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === "ai-model"
                ? "bg-green-500 text-white"
                : "bg-gray-300 text-gray-700 hover:bg-gray-400"
            }`}
          >
            AI Model
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">
                Profile Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
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
                  <label className="block text-sm font-medium mb-2">
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
                  <label className="block text-sm font-medium mb-2">
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
                  <label className="block text-sm font-medium mb-2">
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
                  <label className="block text-sm font-medium mb-2">
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
                  <label className="block text-sm font-medium mb-2">
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
                  <label className="block text-sm font-medium mb-2">
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
                  <label className="block text-sm font-medium mb-2">
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
                  <label className="block text-sm font-medium mb-2">
                    Hours of Operation
                  </label>
                  <input
                    type="text"
                    value={formData.profile.hoursOfOperation}
                    onChange={(e) =>
                      handleInputChange(
                        "profile",
                        "hoursOfOperation",
                        e.target.value,
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Mon-Sun: 10AM-6PM"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
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
            <div className="min-h-screen bg-black text-white">
              {/* Header Section */}
              <div className="flex items-center justify-between mb-6">
                <h1 className={`${typography.h1} text-white mb-0`}>Wine Collection Management</h1>
                <div className="flex items-center gap-4">
                  {showSearch && (
                    <div className="relative flex items-center">
                      <Search className="absolute left-3 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search wines..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-10 py-2 bg-transparent border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm("")}
                          className="absolute right-3 w-4 h-4 text-gray-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                  <Button
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isEditMode
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    {isEditMode ? "Exit Edit" : "Edit Mode"}
                  </Button>
                </div>
              </div>

              {/* Wine Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {wineCards
                  .filter((wine) =>
                    wine.name.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((wine) => (
                    <div
                      key={wine.id}
                      className="relative bg-transparent border border-white/20 rounded-lg p-4 hover:border-green-500 transition-colors group"
                    >
                      {/* Wine Image */}
                      <div className="relative mb-4">
                        <img
                          src={wine.image || placeholderImage}
                          alt={wine.name}
                          className="w-full h-48 object-cover rounded-lg"
                          onLoad={() => console.log(`CMS image loaded: ${wine.name}`)}
                          onError={() => console.log(`CMS placeholder loaded for: ${wine.name}`)}
                        />
                      </div>

                      {/* Wine Info */}
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-white group-hover:text-green-400 transition-colors">
                          {wine.name}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {wine.bottles} bottles available
                        </p>
                        
                        {/* Ratings */}
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="bg-purple-600 px-2 py-1 rounded">VN: {wine.ratings?.vn || 'N/A'}</span>
                          <span className="bg-blue-600 px-2 py-1 rounded">JD: {wine.ratings?.jd || 'N/A'}</span>
                          <span className="bg-orange-600 px-2 py-1 rounded">WS: {wine.ratings?.ws || 'N/A'}</span>
                        </div>

                        {/* QR Code */}
                        <div className="flex items-center justify-between mt-4">
                          <SimpleQRCode 
                            value={generateWineQRData(wine.id)} 
                            size={60}
                            wineId={wine.id}
                          />
                          
                          {isEditMode && (
                            <Button
                              onClick={() => setLocation(`/wine-edit/${wine.id}`)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm rounded"
                            >
                              Edit
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* AI Model Tab */}
          {activeTab === "ai-model" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">AI Model Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Knowledge Scope
                  </label>
                  <select
                    value={formData.aiModel.knowledgeScope}
                    onChange={(e) =>
                      handleInputChange("aiModel", "knowledgeScope", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="winery-only">Winery Only</option>
                    <option value="winery-plus-global">Winery + Global Wine Knowledge</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Personality Style
                  </label>
                  <select
                    value={formData.aiModel.personalityStyle}
                    onChange={(e) =>
                      handleInputChange("aiModel", "personalityStyle", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="educator">Educator</option>
                    <option value="sommelier">Sommelier</option>
                    <option value="tasting-room-host">Tasting Room Host</option>
                    <option value="luxury-concierge">Luxury Concierge</option>
                    <option value="casual-friendly">Casual Friendly</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Brand Guide
                  </label>
                  <textarea
                    value={formData.aiModel.brandGuide}
                    onChange={(e) =>
                      handleInputChange("aiModel", "brandGuide", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Define your winery's brand personality and values..."
                    rows={4}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Tone Preferences
                  </label>
                  <textarea
                    value={formData.aiModel.tonePreferences}
                    onChange={(e) =>
                      handleInputChange("aiModel", "tonePreferences", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Formal, casual, enthusiastic, educational..."
                    rows={3}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Knowledge Documents (Upload)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    multiple
                    onChange={(e) =>
                      handleFileUpload("aiModel", "knowledgeDocuments", e)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Upload additional documents to enhance AI knowledge base
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end mt-8">
            <button
              onClick={handleSave}
              disabled={saveTenantMutation.isPending}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saveTenantMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantAdmin;