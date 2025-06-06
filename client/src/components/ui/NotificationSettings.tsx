import React from "react";
import { BottomSheet } from "./BottomSheet";

interface NotificationPreferences {
  email: boolean;
  phone: boolean;
}

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: NotificationPreferences;
  onPreferencesChange: (preferences: NotificationPreferences) => void;
  onSave?: () => void;
}

export function NotificationSettings({
  isOpen,
  onClose,
  preferences,
  onPreferencesChange,
  onSave,
}: NotificationSettingsProps) {
  const handleToggle = (type: keyof NotificationPreferences) => {
    const newPreferences = {
      ...preferences,
      [type]: !preferences[type],
    };
    onPreferencesChange(newPreferences);
    if (onSave) {
      onSave();
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Manage Notifications">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 0",
          }}
        >
          <div>
            <div
              style={{
                color: "white",
                fontFamily: "Inter, sans-serif",
                fontSize: "16px",
                fontWeight: "500",
                marginBottom: "4px",
              }}
            >
              Email notifications
            </div>
            <div
              style={{
                color: "#CECECE",
                fontFamily: "Inter, sans-serif",
                fontSize: "14px",
              }}
            >
              Receive updates and recommendations via email
            </div>
          </div>
          <input
            type="checkbox"
            checked={preferences.email}
            onChange={() => handleToggle("email")}
            style={{
              width: "20px",
              height: "20px",
              cursor: "pointer",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 0",
          }}
        >
          <div>
            <div
              style={{
                color: "white",
                fontFamily: "Inter, sans-serif",
                fontSize: "16px",
                fontWeight: "500",
                marginBottom: "4px",
              }}
            >
              Phone notifications
            </div>
            <div
              style={{
                color: "#CECECE",
                fontFamily: "Inter, sans-serif",
                fontSize: "14px",
              }}
            >
              Receive SMS alerts and reminders
            </div>
          </div>
          <input
            type="checkbox"
            checked={preferences.phone}
            onChange={() => handleToggle("phone")}
            style={{
              width: "20px",
              height: "20px",
              cursor: "pointer",
            }}
          />
        </div>
      </div>
    </BottomSheet>
  );
}