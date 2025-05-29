import React, { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Button from "@/components/ui/Button";
import typography from "@/styles/typography";

interface WineCardData {
  id: number;
  name: string;
  bottles: number;
  image: string;
  ratings: {
    vn: number;
    jd: number;
    ws: number;
    abv: number;
  };
}

export default function AdminCRM() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [wineCards, setWineCards] = useState<WineCardData[]>([
    {
      id: 1,
      name: 'Ridge "Lytton Springs" Dry Creek Zinfandel',
      bottles: 4,
      image: "/@fs/home/runner/workspace/attached_assets/Product%20Image.png",
      ratings: { vn: 95, jd: 93, ws: 93, abv: 14.3 },
    },
    {
      id: 2,
      name: "2021 Monte Bello Cabernet Sauvignon",
      bottles: 2,
      image: "/@fs/home/runner/workspace/attached_assets/image-2.png",
      ratings: { vn: 95, jd: 93, ws: 93, abv: 14.3 },
    },
  ]);

  const handleAddWine = async () => {
    const newWine: WineCardData = {
      id: Math.max(...wineCards.map((w) => w.id)) + 1,
      name: "New Wine",
      bottles: 1,
      image: "/@fs/home/runner/workspace/attached_assets/Product%20Image.png",
      ratings: { vn: 90, jd: 90, ws: 90, abv: 13.5 },
    };

    setWineCards((prev) => [...prev, newWine]);

    toast({
      title: "Wine Added",
      description: "New wine has been added to your collection.",
    });
  };

  const updateWineCard = (cardId: number, field: string, value: any) => {
    setWineCards((prev) =>
      prev.map((card) =>
        card.id === cardId ? { ...card, [field]: value } : card,
      ),
    );
  };

  const updateWineCardRating = (
    cardId: number,
    ratingType: string,
    value: number,
  ) => {
    setWineCards((prev) =>
      prev.map((card) =>
        card.id === cardId
          ? {
              ...card,
              ratings: { ...card.ratings, [ratingType]: value },
            }
          : card,
      ),
    );
  };

  const deleteWineCard = (cardId: number) => {
    setWineCards((prev) => prev.filter((card) => card.id !== cardId));

    toast({
      title: "Wine Removed",
      description: "Wine has been removed from your collection.",
    });
  };

  return (
    <div className="min-h-screen bg-background text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/90 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation("/home-global")}
              className="text-white hover:text-white/80 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M15.707 4.293a1 1 0 0 1 0 1.414L9.414 12l6.293 6.293a1 1 0 0 1-1.414 1.414l-7-7a1 1 0 0 1 0-1.414l7-7a1 1 0 0 1 1.414 0" />
              </svg>
            </button>
            <h1 style={{ ...typography.h1, color: "white" }}>
              Wine Collection
            </h1>
          </div>
          <Button onClick={handleAddWine}>Add Wine</Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="space-y-8">
          {/* Wine Cards Preview */}
          <div className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wineCards.map((card) => (
                <div
                  key={card.id}
                  style={{
                    background: "rgba(25, 25, 25, 0.8)",
                    borderRadius: "16px",
                    border: "1px solid #494949",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "16px",
                    position: "relative",
                  }}
                >
                  {/* Edit Icon */}
                  <button
                    onClick={() => {
                      const element = document.getElementById(
                        `edit-form-${card.id}`,
                      );
                      if (element) {
                        element.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }
                    }}
                    style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      background: "rgba(255, 255, 255, 0.1)",
                      border: "none",
                      borderRadius: "6px",
                      padding: "8px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    className="hover:bg-white/20 transition-colors"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="white"
                    >
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                    </svg>
                  </button>
                  {/* Wine Image */}
                  <div
                    style={{
                      width: "100px",
                      height: "130px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(255, 255, 255, 0.05)",
                      borderRadius: "8px",
                    }}
                  >
                    <img
                      src={card.image}
                      alt={card.name}
                      style={{
                        maxHeight: "120px",
                        width: "auto",
                      }}
                    />
                  </div>

                  {/* Wine Info */}
                  <div style={{ textAlign: "center", width: "100%" }}>
                    <div
                      style={{
                        ...typography.bodyPlus1,
                        color: "white",
                        marginBottom: "8px",
                      }}
                    >
                      {card.name}
                    </div>

                    <div
                      style={{
                        ...typography.body1R,
                        color: "rgba(255, 255, 255, 0.60)",
                        marginBottom: "16px",
                      }}
                    >
                      {card.bottles} bottles
                    </div>

                    {/* Ratings */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          padding: "6px 8px",
                          alignItems: "baseline",
                          gap: "4px",
                          background: "rgba(255, 255, 255, 0.10)",
                          borderRadius: "8px",
                        }}
                      >
                        <span
                          style={{
                            ...typography.num,
                            color: "white",
                            fontSize: "14px",
                          }}
                        >
                          {card.ratings.vn}
                        </span>
                        <span
                          style={{
                            ...typography.body1R,
                            color: "rgba(255, 255, 255, 0.60)",
                            fontSize: "12px",
                          }}
                        >
                          VN
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          padding: "6px 8px",
                          alignItems: "baseline",
                          gap: "4px",
                          background: "rgba(255, 255, 255, 0.10)",
                          borderRadius: "8px",
                        }}
                      >
                        <span
                          style={{
                            ...typography.num,
                            color: "white",
                            fontSize: "14px",
                          }}
                        >
                          {card.ratings.jd}
                        </span>
                        <span
                          style={{
                            ...typography.body1R,
                            color: "rgba(255, 255, 255, 0.60)",
                            fontSize: "12px",
                          }}
                        >
                          JD
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          padding: "6px 8px",
                          alignItems: "baseline",
                          gap: "4px",
                          background: "rgba(255, 255, 255, 0.10)",
                          borderRadius: "8px",
                        }}
                      >
                        <span
                          style={{
                            ...typography.num,
                            color: "white",
                            fontSize: "14px",
                          }}
                        >
                          {card.ratings.ws}
                        </span>
                        <span
                          style={{
                            ...typography.body1R,
                            color: "rgba(255, 255, 255, 0.60)",
                            fontSize: "12px",
                          }}
                        >
                          WS
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          padding: "6px 8px",
                          alignItems: "baseline",
                          gap: "4px",
                          background: "rgba(255, 255, 255, 0.10)",
                          borderRadius: "8px",
                        }}
                      >
                        <span
                          style={{
                            ...typography.num,
                            color: "white",
                            fontSize: "14px",
                          }}
                        >
                          {card.ratings.abv}%
                        </span>
                        <span
                          style={{
                            ...typography.body1R,
                            color: "rgba(255, 255, 255, 0.60)",
                            fontSize: "12px",
                          }}
                        >
                          ABV
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
