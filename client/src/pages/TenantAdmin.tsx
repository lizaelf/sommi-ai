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

        {/* CMS Tab - Wine Management - Full Screen Layout */}
        {activeTab === "cms" && (
          <div style={{ backgroundColor: "black", minHeight: "100vh", padding: "24px", position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}>
            {/* Header Section */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <Link to="/somm-tenant-admin">
                  <div
                    style={{
                      padding: "8px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                  >
                    <ArrowLeft size={20} color="white" />
                  </div>
                </Link>
                <h1 className={`${typography.h1} text-white`} style={{ margin: 0 }}>
                  Wine Collection Management
                </h1>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {showSearch && (
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <Search
                      style={{
                        position: "absolute",
                        left: "12px",
                        width: "16px",
                        height: "16px",
                        color: "rgba(156, 163, 175, 1)",
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Search wines..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        paddingLeft: "40px",
                        paddingRight: "40px",
                        paddingTop: "8px",
                        paddingBottom: "8px",
                        backgroundColor: "transparent",
                        border: "1px solid rgba(75, 85, 99, 1)",
                        borderRadius: "8px",
                        color: "white",
                        outline: "none",
                      }}
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        style={{
                          position: "absolute",
                          right: "12px",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "rgba(156, 163, 175, 1)",
                        }}
                      >
                        <X style={{ width: "16px", height: "16px" }} />
                      </button>
                    )}
                  </div>
                )}

                <Button
                  onClick={() => setIsEditMode(!isEditMode)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    transition: "background-color 0.2s",
                    backgroundColor: isEditMode ? "#dc2626" : "#16a34a",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {isEditMode ? "Exit Edit" : "Edit Mode"}
                </Button>
              </div>
            </div>

            {/* Wine Cards Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "24px",
              }}
            >
              {wineCards
                .filter((wine) =>
                  wine.name.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((wine) => (
                  <div
                    key={wine.id}
                    style={{
                      position: "relative",
                      backgroundColor: "transparent",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      borderRadius: "12px",
                      padding: "16px",
                      transition: "border-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#10b981";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
                    }}
                  >
                    {/* Wine Image */}
                    <div style={{ position: "relative", marginBottom: "16px" }}>
                      <img
                        src={wine.image || placeholderImage}
                        alt={wine.name}
                        style={{
                          width: "100%",
                          height: "192px",
                          objectFit: "cover",
                          borderRadius: "8px",
                        }}
                        onLoad={() => console.log(`CMS image loaded: ${wine.name}`)}
                        onError={() => console.log(`CMS placeholder loaded for: ${wine.name}`)}
                      />
                    </div>

                    {/* Wine Info */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <h3
                        style={{
                          fontSize: "18px",
                          fontWeight: "600",
                          color: "white",
                          margin: 0,
                          transition: "color 0.2s",
                        }}
                      >
                        {wine.name}
                      </h3>
                      <p style={{ color: "#9ca3af", fontSize: "14px", margin: 0 }}>
                        {wine.bottles} bottles available
                      </p>

                      {/* Ratings */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
                        <span
                          style={{
                            backgroundColor: "#7c3aed",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            color: "white",
                          }}
                        >
                          VN: {wine.ratings?.vn || "N/A"}
                        </span>
                        <span
                          style={{
                            backgroundColor: "#2563eb",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            color: "white",
                          }}
                        >
                          JD: {wine.ratings?.jd || "N/A"}
                        </span>
                        <span
                          style={{
                            backgroundColor: "#ea580c",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            color: "white",
                          }}
                        >
                          WS: {wine.ratings?.ws || "N/A"}
                        </span>
                      </div>

                      {/* QR Code and Edit Button */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginTop: "16px",
                        }}
                      >
                        <SimpleQRCode value={generateWineQRData(wine.id)} size={60} wineId={wine.id} />

                        {isEditMode && (
                          <button
                            onClick={() => setLocation(`/wine-edit/${wine.id}`)}
                            style={{
                              backgroundColor: "#2563eb",
                              color: "white",
                              padding: "4px 12px",
                              fontSize: "14px",
                              borderRadius: "4px",
                              border: "none",
                              cursor: "pointer",
                              transition: "background-color 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#1d4ed8";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "#2563eb";
                            }}
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Content - Other Tabs */}
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