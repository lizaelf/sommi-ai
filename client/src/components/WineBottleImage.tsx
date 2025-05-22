import React from 'react';

// Create a styled wine bottle container
const WineBottleImage: React.FC = () => {
  return (
    <div
      style={{
        width: '140px',
        height: '280px',
        backgroundColor: '#000',
        borderRadius: '0 0 70px 70px',
        position: 'relative',
        zIndex: 2,
        marginBottom: '16px',
        boxShadow: '0 0 15px rgba(255, 255, 255, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Bottle cap */}
      <div
        style={{
          width: '50px',
          height: '20px',
          backgroundColor: '#999',
          borderRadius: '5px 5px 0 0',
          margin: '0 auto',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      />
      
      {/* Bottle neck */}
      <div
        style={{
          width: '40px',
          height: '60px',
          backgroundColor: '#111',
          margin: '0 auto',
          boxShadow: 'inset 0 0 10px rgba(139, 69, 19, 0.5)'
        }}
      />
      
      {/* Bottle shoulder */}
      <div
        style={{
          width: '100%',
          height: '20px',
          background: 'linear-gradient(to bottom, #111 0%, #222 100%)'
        }}
      />
      
      {/* Bottle body */}
      <div
        style={{
          flex: 1,
          width: '100%',
          background: 'linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(50,0,0,0.5) 50%, rgba(0,0,0,0.9) 100%)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Label */}
        <div
          style={{
            width: '90px',
            height: '120px',
            backgroundColor: '#f5f5f5',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '5px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
          }}
        >
          <div style={{ fontSize: '10px', fontWeight: 'bold', textAlign: 'center', color: '#000' }}>
            RIDGE
          </div>
          <div style={{ fontSize: '8px', fontWeight: 'bold', textAlign: 'center', color: '#000', marginBottom: '5px' }}>
            2021
          </div>
          <div style={{ fontSize: '7px', fontWeight: 'bold', textAlign: 'center', color: '#000' }}>
            LYTTON SPRINGS
          </div>
          <div style={{ fontSize: '5px', color: '#444', textAlign: 'center', marginTop: '10px' }}>
            DRY CREEK VALLEY
          </div>
        </div>
      </div>
      
      {/* Bottle base reflection */}
      <div
        style={{
          width: '100%',
          height: '10px',
          background: 'linear-gradient(to bottom, #222 0%, #111 100%)'
        }}
      />
    </div>
  );
};

export default WineBottleImage;