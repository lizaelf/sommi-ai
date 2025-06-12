import React from 'react';
import Button from "./ui/Button";

interface CodeFreezedInputProps {
  className?: string;
}

const CodeFreezedInput: React.FC<CodeFreezedInputProps> = ({ className = "" }) => {
  return (
    <div
      className={className}
      style={{
        backgroundColor: "#1C1C1C",
        padding: "16px",
        zIndex: 50,
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        borderTop: "1px solid rgba(255, 255, 255, 0.2)",
        opacity: 0.6,
        pointerEvents: "none",
      }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Suggestion chips - frozen/disabled */}
        <div className="scrollbar-hide overflow-x-auto mb-2 sm:mb-3 pb-1 -mt-1 flex gap-1.5 sm:gap-2 w-full">
          <Button
            variant="secondary"
            className="whitespace-nowrap flex-shrink-0"
            style={{ opacity: 0.5, cursor: "not-allowed", fontSize: "14px", padding: "8px 16px" }}
            disabled
          >
            Tasting notes
          </Button>
          <Button
            variant="secondary"
            className="whitespace-nowrap flex-shrink-0"
            style={{ opacity: 0.5, cursor: "not-allowed", fontSize: "14px", padding: "8px 16px" }}
            disabled
          >
            Food pairing
          </Button>
          <Button
            variant="secondary"
            className="whitespace-nowrap flex-shrink-0"
            style={{ opacity: 0.5, cursor: "not-allowed", fontSize: "14px", padding: "8px 16px" }}
            disabled
          >
            Serving temperature
          </Button>
          <Button
            variant="secondary"
            className="whitespace-nowrap flex-shrink-0"
            style={{ opacity: 0.5, cursor: "not-allowed", fontSize: "14px", padding: "8px 16px" }}
            disabled
          >
            Aging potential
          </Button>
        </div>

        {/* Frozen Voice Assistant and Chat Input */}
        <div className="flex gap-2 sm:gap-3 items-end w-full">
          {/* Frozen Voice Button */}
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "24px",
              backgroundColor: "#2A2A2A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.5,
              cursor: "not-allowed",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 1C10.34 1 9 2.34 9 4V10C9 11.66 10.34 13 12 13C13.66 13 15 11.66 15 10V4C15 2.34 13.66 1 12 1Z"
                fill="rgba(255, 255, 255, 0.4)"
              />
              <path
                d="M19 10V12C19 16.42 15.42 20 11 20H9V22H11C16.52 22 21 17.52 21 12V10H19Z"
                fill="rgba(255, 255, 255, 0.4)"
              />
              <path
                d="M5 10V12C5 13.89 5.85 15.6 7.25 16.74L8.67 15.32C7.8 14.64 7.25 13.42 7.25 12V10H5Z"
                fill="rgba(255, 255, 255, 0.4)"
              />
            </svg>
          </div>
          
          {/* Frozen Chat Input */}
          <div className="flex-1">
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '64px',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backgroundColor: '#2A2A2A',
                opacity: 0.5,
              }}
            >
              <input
                type="text"
                value=""
                readOnly
                disabled
                style={{
                  display: 'flex',
                  padding: '0 50px 4px 24px',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  alignSelf: 'stretch',
                  borderRadius: '24px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  width: '100%',
                  height: '64px',
                  outline: 'none',
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  lineHeight: '24px',
                  fontWeight: 400,
                  cursor: 'not-allowed',
                }}
                placeholder="Ask me about wine..."
              />
              
              {/* Frozen Send button */}
              <div
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '48px',
                  height: '48px',
                  borderRadius: '24px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'not-allowed',
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z"
                    fill="rgba(255, 255, 255, 0.3)"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeFreezedInput;