import React, { useState, useRef } from "react";
import { Upload, Save, X } from "lucide-react";
import Button from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import typography from "@/styles/typography";
import { FormInput } from "@/components/ui/FormInput";

interface WineEditFormProps {
  wine: {
    id: number;
    name: string;
    year: number;
    bottles: number;
    image: string;
    ratings: {
      vn: number;
      jd: number;
      ws: number;
      abv: number;
    };
  };
  onSave: (wineData: any) => void;
  onCancel: () => void;
}

export const WineEditForm: React.FC<WineEditFormProps> = ({
  wine,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState(wine);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>(wine.image);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedWine = {
      ...formData,
      image: previewImage,
    };
    
    onSave(updatedWine);
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: "20px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ ...typography.h1, marginBottom: "16px" }}>
          Edit Wine Details
        </h2>
      </div>

      {/* Wine Image */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ ...typography.body1R, display: "block", marginBottom: "8px" }}>
          Wine Image
        </label>
        <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
          <div
            style={{
              width: "120px",
              height: "160px",
              border: "2px dashed #333",
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              backgroundColor: "#1A1A1A",
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            {previewImage ? (
              <img
                src={previewImage}
                alt="Wine preview"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "6px",
                }}
              />
            ) : (
              <>
                <Upload size={24} color="#666" />
                <span style={{ ...typography.body1R, color: "#666", marginTop: "8px" }}>
                  Upload Image
                </span>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: "none" }}
          />
        </div>
      </div>

      {/* Wine Name */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ ...typography.body1R, display: "block", marginBottom: "8px" }}>
          Wine Name
        </label>
        <FormInput
          type="text"
          name="wineName"
          value={formData.name}
          onChange={(value) => setFormData({ ...formData, name: value })}
        />
      </div>

      {/* Year and Bottles */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
        <div style={{ flex: 1 }}>
          <label style={{ ...typography.body1R, display: "block", marginBottom: "8px" }}>
            Year
          </label>
          <FormInput
            type="number"
            name="year"
            value={formData.year.toString()}
            onChange={(value) => setFormData({ ...formData, year: parseInt(value) || 0 })}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ ...typography.body1R, display: "block", marginBottom: "8px" }}>
            Bottles
          </label>
          <FormInput
            type="number"
            name="bottles"
            value={formData.bottles.toString()}
            onChange={(value) => setFormData({ ...formData, bottles: parseInt(value) || 0 })}
          />
        </div>
      </div>

      {/* Ratings */}
      <div style={{ marginBottom: "24px" }}>
        <h3 style={{ ...typography.h2, marginBottom: "16px" }}>
          Ratings
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ ...typography.body1R, display: "block", marginBottom: "8px" }}>
              Vinous (VN)
            </label>
            <FormInput
              type="number"
              name="vnRating"
              value={formData.ratings.vn.toString()}
              onChange={(value) => setFormData({
                ...formData,
                ratings: { ...formData.ratings, vn: parseFloat(value) || 0 }
              })}
            />
          </div>
          <div>
            <label style={{ ...typography.body1R, display: "block", marginBottom: "8px" }}>
              James Delucca (JD)
            </label>
            <FormInput
              type="number"
              name="jdRating"
              value={formData.ratings.jd.toString()}
              onChange={(value) => setFormData({
                ...formData,
                ratings: { ...formData.ratings, jd: parseFloat(value) || 0 }
              })}
            />
          </div>
          <div>
            <label style={{ ...typography.body1R, display: "block", marginBottom: "8px" }}>
              Wine Spectator (WS)
            </label>
            <FormInput
              type="number"
              name="wsRating"
              value={formData.ratings.ws.toString()}
              onChange={(value) => setFormData({
                ...formData,
                ratings: { ...formData.ratings, ws: parseFloat(value) || 0 }
              })}
            />
          </div>
          <div>
            <label style={{ ...typography.body1R, display: "block", marginBottom: "8px" }}>
              ABV (%)
            </label>
            <FormInput
              type="number"
              name="abvRating"
              value={formData.ratings.abv.toString()}
              onChange={(value) => setFormData({
                ...formData,
                ratings: { ...formData.ratings, abv: parseFloat(value) || 0 }
              })}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="secondary" onClick={() => handleSubmit({} as React.FormEvent)}>
          <Save size={16} />
          Save Changes
        </Button>
      </div>
    </form>
  );
};