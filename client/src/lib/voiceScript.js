// Variable to store the last audio blob for playback
let lastAudioBlob = null;
let statusDiv = null;

// DOM load event to initialize everything
document.addEventListener('DOMContentLoaded', function() {
  // Get the microphone button and status div
  const micButton = document.getElementById('mic-button');
  statusDiv = document.getElementById('status');
  
  // Speech recognition setup
  let recognition = null;
  if (window.SpeechRecognition || window.webkitSpeechRecognition) {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onresult = function(event) {
      const transcript = event.results[0][0].transcript;
      statusDiv.textContent = 'Processing your question...';
      
      // Send the message through your chat interface
      // You'll need to adapt this to your app's message sending mechanism
      sendMessage(transcript);
    };
    
    recognition.onend = function() {
      micButton.classList.remove('listening');
      statusDiv.textContent = '';
    };
    
    recognition.onstart = function() {
      micButton.classList.add('listening');
      statusDiv.textContent = 'Listening for your question...';
    };
    
    recognition.onerror = function(event) {
      console.error('Speech recognition error:', event.error);
      statusDiv.textContent = `Error: ${event.error}`;
      micButton.classList.remove('listening');
    };
  }
  
  // Microphone button click handler
  if (micButton) {
    micButton.addEventListener('click', function() {
      if (!recognition) {
        alert("Your browser doesn't support speech recognition. Try using Chrome.");
        return;
      }
      
      if (micButton.classList.contains('listening')) {
        recognition.stop();
      } else {
        try {
          recognition.start();
        } catch (error) {
          console.error('Failed to start speech recognition:', error);
          alert("Failed to start speech recognition. Please try again.");
        }
      }
    });
  }
  
  // Set up audio context for better audio support
  try {
    window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    console.log('Audio context created');
  } catch (e) {
    console.warn('Unable to initialize AudioContext:', e);
  }
});

// Modified version of the speakResponse function
async function speakResponse(text) {
  try {
    if (!statusDiv) {
      statusDiv = document.getElementById('status');
    }
    
    statusDiv.textContent = 'Getting voice response...';
    
    const response = await fetch('/api/text-to-speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    
    // Save the audio blob for later use
    lastAudioBlob = await response.blob();
    console.log("Audio received:", lastAudioBlob.size, "bytes");
    
    // Show the audio controls
    const audioControls = document.getElementById('audio-controls');
    if (audioControls) {
      audioControls.style.display = 'block';
    }
    
    // Set up the play button
    const playBtn = document.getElementById('play-audio-btn');
    if (playBtn) {
      playBtn.onclick = playLastAudio;
    }
    
    statusDiv.textContent = 'Audio ready to play';
  } catch (error) {
    console.error("Error:", error);
    statusDiv.textContent = 'Failed to get audio';
  }
}

function playLastAudio() {
  if (!lastAudioBlob) {
    console.error("No audio available");
    return;
  }
  
  const url = URL.createObjectURL(lastAudioBlob);
  const audio = new Audio(url);
  
  audio.onended = () => {
    URL.revokeObjectURL(url);
  };
  
  audio.play().catch(err => {
    console.error("Playback error:", err);
  });
  
  statusDiv.textContent = 'Playing...';
}

// Helper function to send a message (you'll need to adapt this)
function sendMessage(text) {
  // This is a placeholder - replace with your app's message sending logic
  console.log("Sending message:", text);
  
  // Example implementation - dispatch a custom event
  const event = new CustomEvent('voiceMessage', { detail: { text } });
  document.dispatchEvent(event);
}

// Function to find and speak the last assistant message
function speakLastAssistantMessage() {
  try {
    console.log("Finding message to speak automatically...");
    
    // Find the last assistant message
    const messagesContainer = document.getElementById('conversation');
    console.log("Messages container found:", !!messagesContainer);
    
    if (messagesContainer) {
      // Get all the chat messages
      const messageElements = messagesContainer.querySelectorAll('[data-role="assistant"]');
      console.log("Assistant message elements found:", messageElements.length);
      
      if (messageElements && messageElements.length > 0) {
        // Get the last message
        const lastMessage = messageElements[messageElements.length - 1];
        
        if (lastMessage && lastMessage.textContent) {
          const messageText = lastMessage.textContent || '';
          console.log("Found message to speak:", messageText.substring(0, 50) + "...");
          
          // Speak the response with a small delay to ensure message is fully rendered
          setTimeout(() => {
            speakResponse(messageText);
          }, 300);
        } else {
          console.log("Last message has no text content");
        }
      }
    }
  } catch (error) {
    console.error('Error finding assistant message to speak:', error);
  }
}

// Export functions for use in React components if needed
if (typeof window !== 'undefined') {
  window.voiceAssistant = {
    speakResponse,
    playLastAudio,
    speakLastAssistantMessage
  };
}