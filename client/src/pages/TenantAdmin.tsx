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
      personalityStyle: "educator",
      brandGuide: "",
      tonePreferences: "",
      knowledgeDocuments: "",
    },
  });

  const queryClient = useQueryClient();

  // Load tenant data
  const { data: tenantData, isLoading } = useQuery({
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
                    placeholder="https://winery.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Address (Street, City, State, Zip, Country)
                  </label>
                  <textarea
                    value={formData.profile.address}
                    onChange={(e) =>
                      handleInputChange("profile", "address", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123 Vineyard Lane, Napa, CA 94558, USA"
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
                    Social Media Links (Instagram, Facebook, X, etc.)
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
              {/* Search and Controls */}
              <div className="sticky top-0 z-10 backdrop-blur-md" style={{ backgroundColor: "rgba(0, 0, 0, 0.9)" }}>
                <div className="p-4">
                  {showSearch && (
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search wines..."
                        className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
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
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Button
                      onClick={() => setIsEditMode(!isEditMode)}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        isEditMode
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : "bg-white/20 hover:bg-white/30 text-white border border-white/30"
                      }`}
                    >
                      {isEditMode ? "Exit Edit" : "Edit Mode"}
                    </Button>

                    <Button
                      onClick={() => setLocation("/wine-edit")}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                    >
                      Add Wine
                    </Button>

                    <Button
                      onClick={() => setShowDataSync(!showDataSync)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Data Sync
                    </Button>

                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      accept=".json"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            try {
                              const importedData = JSON.parse(event.target?.result as string);
                              toast({
                                title: "Data imported successfully",
                                description: `Imported ${importedData.length} wine entries`,
                              });
                              loadWineData();
                            } catch (error) {
                              toast({
                                title: "Import failed",
                                description: "Invalid JSON file format",
                                variant: "destructive",
                              });
                            }
                          };
                          reader.readAsText(file);
                        }
                      }}
                    />

                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Import
                    </Button>

                    <Button
                      onClick={() => {
                        const dataStr = JSON.stringify(wineCards, null, 2);
                        const dataBlob = new Blob([dataStr], { type: "application/json" });
                        const url = URL.createObjectURL(dataBlob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = "wine-data.json";
                        link.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </Button>
                  </div>
                </div>
              </div>

              {/* Wine Cards Grid */}
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {wineCards
                    .filter(wine => wine.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((wine) => (
                    <div
                      key={wine.id}
                      className="relative bg-white/5 border border-white/20 rounded-lg p-4 hover:bg-white/10 transition-all cursor-pointer backdrop-blur-sm"
                      onClick={() => !isEditMode && setLocation(`/wine-details/${wine.id}`)}
                    >
                      {/* Wine Image */}
                      <div className="aspect-[3/4] mb-3 rounded-lg overflow-hidden bg-white/5">
                        <img
                          src={wine.image || placeholderImage}
                          alt={wine.name}
                          className="w-full h-full object-cover"
                          onLoad={() => console.log(`CMS image loaded: ${wine.name}`)}
                          onError={(e) => {
                            console.log(`CMS placeholder loaded for: ${wine.name}`);
                            (e.target as HTMLImageElement).src = placeholderImage;
                          }}
                        />
                      </div>

                      {/* Wine Details */}
                      <div className="space-y-2">
                        <h3 className="text-white font-medium text-sm leading-tight line-clamp-2">
                          {wine.name}
                        </h3>
                        
                        {wine.year && (
                          <p className="text-white/70 text-xs">
                            {wine.year}
                          </p>
                        )}

                        <p className="text-white/70 text-xs">
                          {wine.bottles} bottles
                        </p>

                        {/* Ratings */}
                        {wine.ratings && (
                          <div className="flex flex-wrap gap-1 text-xs">
                            {wine.ratings.vn && (
                              <span className="bg-red-600/20 text-red-400 px-2 py-1 rounded">
                                VN {wine.ratings.vn}
                              </span>
                            )}
                            {wine.ratings.jd && (
                              <span className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded">
                                JD {wine.ratings.jd}
                              </span>
                            )}
                            {wine.ratings.ws && (
                              <span className="bg-green-600/20 text-green-400 px-2 py-1 rounded">
                                WS {wine.ratings.ws}
                              </span>
                            )}
                          </div>
                        )}

                        {/* QR Code */}
                        <div className="flex justify-center mt-3">
                          <SimpleQRCode 
                            value={generateWineQRData(wine.id)} 
                            size={60}
                            wineId={wine.id}
                          />
                        </div>
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
                                // Delete wine logic would go here
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
                    className="border border-gray-200 rounded-lg p-6 mb-4"
                  >
                    <h3 className="text-lg font-medium mb-4">
                      Wine Entry #{index + 1}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Wine Name
                        </label>
                        <input
                          type="text"
                          value={wine.wineName}
                          onChange={(e) =>
                            handleWineEntryChange(
                              index,
                              "wineName",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Wine name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Vintage Year
                        </label>
                        <input
                          type="text"
                          value={wine.vintageYear}
                          onChange={(e) =>
                            handleWineEntryChange(
                              index,
                              "vintageYear",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="2021"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          SKU
                        </label>
                        <input
                          type="text"
                          value={wine.sku}
                          onChange={(e) =>
                            handleWineEntryChange(index, "sku", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="SKU-001"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Varietal / Blend
                        </label>
                        <input
                          type="text"
                          value={wine.varietal}
                          onChange={(e) =>
                            handleWineEntryChange(
                              index,
                              "varietal",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Cabernet Sauvignon"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Release Date
                        </label>
                        <input
                          type="date"
                          value={wine.releaseDate}
                          onChange={(e) =>
                            handleWineEntryChange(
                              index,
                              "releaseDate",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Price
                        </label>
                        <input
                          type="text"
                          value={wine.price}
                          onChange={(e) =>
                            handleWineEntryChange(
                              index,
                              "price",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="$50.00"
                        />
                      </div>
                      <div className="md:col-span-2 lg:col-span-3">
                        <label className="block text-sm font-medium mb-1">
                          Tasting Notes
                        </label>
                        <textarea
                          value={wine.tastingNotes}
                          onChange={(e) =>
                            handleWineEntryChange(
                              index,
                              "tastingNotes",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Describe the wine's characteristics..."
                          rows={3}
                        />
                      </div>
                      <div className="md:col-span-2 lg:col-span-3">
                        <label className="block text-sm font-medium mb-1">
                          Food Pairings
                        </label>
                        <input
                          type="text"
                          value={wine.foodPairings}
                          onChange={(e) =>
                            handleWineEntryChange(
                              index,
                              "foodPairings",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Grilled meats, aged cheeses, dark chocolate"
                        />
                      </div>
                      <div className="md:col-span-2 lg:col-span-3">
                        <label className="block text-sm font-medium mb-1">
                          Production Notes
                        </label>
                        <textarea
                          value={wine.productionNotes}
                          onChange={(e) =>
                            handleWineEntryChange(
                              index,
                              "productionNotes",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Production methods, aging, etc."
                          rows={2}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Inventory Count (Optional)
                        </label>
                        <input
                          type="number"
                          value={wine.inventoryCount}
                          onChange={(e) =>
                            handleWineEntryChange(
                              index,
                              "inventoryCount",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="100"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Wine Club Info Section */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Wine Club Info</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Club Name
                    </label>
                    <input
                      type="text"
                      value={formData.cms.wineClub.clubName}
                      onChange={(e) =>
                        handleWineClubChange("clubName", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Elite Wine Club"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Membership Tiers
                    </label>
                    <input
                      type="text"
                      value={formData.cms.wineClub.membershipTiers}
                      onChange={(e) =>
                        handleWineClubChange("membershipTiers", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Silver, Gold, Platinum"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.cms.wineClub.description}
                      onChange={(e) =>
                        handleWineClubChange("description", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe the wine club..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Pricing
                    </label>
                    <input
                      type="text"
                      value={formData.cms.wineClub.pricing}
                      onChange={(e) =>
                        handleWineClubChange("pricing", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="$99/quarter"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Club Benefits
                    </label>
                    <textarea
                      value={formData.cms.wineClub.clubBenefits}
                      onChange={(e) =>
                        handleWineClubChange("clubBenefits", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Exclusive wines, discounts, events..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Model Tab */}
          {activeTab === "ai-model" && (
            <div className="space-y-8">
              {/* Knowledge Scope */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Knowledge Scope</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Knowledge Scope Toggle:
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="knowledgeScope"
                          value="winery-only"
                          checked={
                            formData.aiModel.knowledgeScope === "winery-only"
                          }
                          onChange={(e) =>
                            handleInputChange(
                              "aiModel",
                              "knowledgeScope",
                              e.target.value,
                            )
                          }
                          className="mr-2"
                        />
                        Winery-Only Mode (Default)
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="knowledgeScope"
                          value="winery-plus-global"
                          checked={
                            formData.aiModel.knowledgeScope ===
                            "winery-plus-global"
                          }
                          onChange={(e) =>
                            handleInputChange(
                              "aiModel",
                              "knowledgeScope",
                              e.target.value,
                            )
                          }
                          className="mr-2"
                        />
                        Winery plus Global Wine and Food Knowledge
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personality Selection */}
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Personality Selection (Basic)
                </h2>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Select Personality Style (Dropdown):
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="educator">Educator</option>
                    <option value="sommelier">Sommelier</option>
                    <option value="tasting-room-host">Tasting Room Host</option>
                    <option value="luxury-concierge">Luxury Concierge</option>
                    <option value="casual-friendly">Casual Friendly</option>
                  </select>
                </div>
              </div>

              {/* Advanced Personality Upload */}
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Advanced Personality Upload
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Upload Brand Guide (PDF / DOC)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) =>
                        handleFileUpload("aiModel", "brandGuide", e)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Upload Tone Preferences (Text Input)
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe the desired tone and personality for AI responses..."
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Upload FAQ or Knowledge Documents (DOC / CSV / PDF)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.csv"
                      onChange={(e) =>
                        handleFileUpload("aiModel", "knowledgeDocuments", e)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
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
