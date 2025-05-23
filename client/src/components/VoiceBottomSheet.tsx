import React from 'react';

interface VoiceBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onMute: () => void;
  onAsk: () => void;
}

const VoiceBottomSheet: React.FC<VoiceBottomSheetProps> = ({
  isOpen,
  onClose,
  onMute,
  onAsk
}) => {
  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'absolute',
        bottom: '70px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '300px',
        zIndex: 9999,
        backgroundColor: '#1C1C1C',
        borderRadius: '24px',
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          padding: '16px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Close button */}
        <div
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            cursor: 'pointer'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Wine glass */}
        <div style={{ 
          marginTop: '10px', 
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          width: '120px',
          height: '120px'
        }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #5D0E0E 0%, #A31B1B 50%, #6B0A0A 100%)',
            boxShadow: 'inset 0 0 15px rgba(0, 0, 0, 0.5), 0 0 10px rgba(163, 27, 27, 0.4)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Wine reflection */}
            <div style={{
              position: 'absolute',
              width: '60%',
              height: '10%',
              top: '20%',
              left: '20%',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              transform: 'rotate(-45deg)'
            }} />
          </div>
          {/* Glass outline */}
          <div style={{
            position: 'absolute',
            width: '110px',
            height: '110px',
            borderRadius: '50%',
            border: '2px solid rgba(255, 255, 255, 0.6)',
            pointerEvents: 'none'
          }} />
        </div>

        {/* Action buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          marginBottom: '12px'
        }}>
          <button
            onClick={onMute}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              color: 'white',
              borderRadius: '24px',
              padding: '8px 12px',
              width: '45%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            <span>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.8337 10.0001C15.8337 12.3013 14.3183 14.2576 12.2503 15.109M10.0003 17.5001C13.6822 17.5001 16.667 14.5152 16.667 10.8334C16.667 7.15152 13.6822 4.16675 10.0003 4.16675C6.31842 4.16675 3.33366 7.15152 3.33366 10.8334C3.33366 14.5152 6.31842 17.5001 10.0003 17.5001ZM10.0003 17.5001V20.8334M15.0003 20.8334H5.00033M12.5003 6.25008C12.5003 7.63394 11.3842 8.75008 10.0003 8.75008C8.61652 8.75008 7.50037 7.63394 7.50037 6.25008C7.50037 4.86623 8.61652 3.75008 10.0003 3.75008C11.3842 3.75008 12.5003 4.86623 12.5003 6.25008Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span>Mute</span>
          </button>
          <button
            onClick={onAsk}
            style={{
              backgroundColor: 'white',
              color: 'black',
              borderRadius: '24px',
              padding: '8px 12px',
              width: '45%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '14px'
            }}
          >
            <span>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 16.6667C13.6819 16.6667 16.6667 13.6819 16.6667 10C16.6667 6.31811 13.6819 3.33334 10 3.33334C6.31814 3.33334 3.33337 6.31811 3.33337 10C3.33337 13.6819 6.31814 16.6667 10 16.6667Z" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 7.5V12.5" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7.5 10H12.5" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span>Ask</span>
          </button>
        </div>

        {/* Sommelier attribution */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: 'rgba(255, 255, 255, 0.6)',
          marginTop: '5px',
          width: '100%',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          paddingTop: '8px',
          fontSize: '12px'
        }}>
          <span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.00016 1.33334C4.32016 1.33334 1.3335 4.32001 1.3335 8.00001C1.3335 11.68 4.32016 14.6667 8.00016 14.6667C11.6802 14.6667 14.6668 11.68 14.6668 8.00001C14.6668 4.32001 11.6802 1.33334 8.00016 1.33334ZM8.00016 13.3333C5.06016 13.3333 2.66683 10.94 2.66683 8.00001C2.66683 5.06001 5.06016 2.66668 8.00016 2.66668C10.9402 2.66668 13.3335 5.06001 13.3335 8.00001C13.3335 10.94 10.9402 13.3333 8.00016 13.3333Z" fill="white" fillOpacity="0.6"/>
              <path d="M8.00016 4.66667C7.63349 4.66667 7.3335 4.96667 7.3335 5.33334V8.66667C7.3335 9.03334 7.63349 9.33334 8.00016 9.33334H10.0002C10.3668 9.33334 10.6668 9.03334 10.6668 8.66667C10.6668 8.30001 10.3668 8.00001 10.0002 8.00001H8.66683V5.33334C8.66683 4.96667 8.36683 4.66667 8.00016 4.66667Z" fill="white" fillOpacity="0.6"/>
            </svg>
          </span>
          <span style={{ fontSize: '14px' }}>somm.ai</span>
          <span style={{ marginLeft: 'auto' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16.6668 10C16.6668 6.32001 13.6802 3.33334 10.0002 3.33334C6.32016 3.33334 3.3335 6.32001 3.3335 10C3.3335 13.68 6.32016 16.6667 10.0002 16.6667" stroke="white" strokeOpacity="0.6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10.8335 3.41667C10.8335 3.41667 13.3335 6.66667 13.3335 10" stroke="white" strokeOpacity="0.6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9.1665 16.5833C9.1665 16.5833 6.6665 13.3333 6.6665 10" stroke="white" strokeOpacity="0.6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3.5752 12.0833C3.5752 12.0833 6.66683 11.25 10.0002 11.25C13.3335 11.25 16.4252 12.0833 16.4252 12.0833" stroke="white" strokeOpacity="0.6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16.1918 13.75L17.5002 16.6667L14.5835 15.3583" stroke="white" strokeOpacity="0.6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
};

export default VoiceBottomSheet;