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
  
  // Add a test button handler if it exists
  const testButton = document.getElementById('test-button');
  if (testButton) {
    testButton.addEventListener('click', function() {
      console.log("Test button clicked");
      const testText = "Hello, I'm your AI sommelier. This is a test of the voice system.";
      speakResponse(testText);
    });
  }

  // Add a test message button handler if it exists
  const addMessageButton = document.getElementById('add-message');
  if (addMessageButton) {
    addMessageButton.addEventListener('click', function() {
      console.log("Adding test message");
      const conversation = document.getElementById('conversation');
      if (conversation) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message assistant';
        messageDiv.setAttribute('data-role', 'assistant');
        messageDiv.textContent = "This is a test response about wine. Cabernet Sauvignon pairs well with red meat dishes.";
        conversation.appendChild(messageDiv);
        speakLastAssistantMessage();
      }
    });
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
    console.log("Audio received:", lastAudioBlob.size, "bytes", "type:", lastAudioBlob.type);
    
    // Create audio element and append to document - this helps with some browser issues
    const audioElement = document.createElement('audio');
    audioElement.id = 'audio-player';
    audioElement.style.display = 'none';
    document.body.appendChild(audioElement);
    
    // Create object URL
    const url = URL.createObjectURL(lastAudioBlob);
    audioElement.src = url;
    
    // Set up event listeners for the audio element
    audioElement.oncanplaythrough = () => {
      console.log("Audio can play through");
    };
    
    audioElement.onerror = (e) => {
      console.error("Audio error:", e);
    };
    
    // Show the audio controls
    const audioControls = document.getElementById('audio-controls');
    if (audioControls) {
      audioControls.style.display = 'block';
      // Force the controls to be visible
      audioControls.setAttribute('style', 'display: block !important; margin-top: 15px; text-align: center;');
    }
    
    // Set up the play button with a direct onclick handler
    const playBtn = document.getElementById('play-audio-btn');
    if (playBtn) {
      // Remove any existing event listeners
      playBtn.replaceWith(playBtn.cloneNode(true));
      
      // Get the fresh button and add a new click handler
      const newPlayBtn = document.getElementById('play-audio-btn');
      newPlayBtn.addEventListener('click', function() {
        console.log("Play button clicked");
        audioElement.play()
          .then(() => {
            console.log("Audio playback started successfully");
            statusDiv.textContent = 'Playing...';
          })
          .catch(err => {
            console.error("Audio playback error:", err);
            statusDiv.textContent = 'Error playing audio';
            
            // Fallback to browser's built-in speech synthesis
            if ('speechSynthesis' in window) {
              console.log("Trying browser speech synthesis");
              const utterance = new SpeechSynthesisUtterance(text);
              utterance.lang = 'en-US';
              window.speechSynthesis.speak(utterance);
              statusDiv.textContent = 'Using browser speech...';
            }
          });
      });
      
      // Make the button very noticeable
      newPlayBtn.style.backgroundColor = '#8B0000';
      newPlayBtn.style.color = 'white';
      newPlayBtn.style.padding = '10px 20px';
      newPlayBtn.style.border = 'none';
      newPlayBtn.style.borderRadius = '5px';
      newPlayBtn.style.cursor = 'pointer';
      newPlayBtn.textContent = 'Play Response Audio';
    }
    
    statusDiv.textContent = 'Audio ready - Click play button to listen';
    
    // Clean up URL object when audio ends
    audioElement.onended = () => {
      URL.revokeObjectURL(url);
      statusDiv.textContent = '';
      // Remove the audio element
      if (audioElement.parentNode) {
        audioElement.parentNode.removeChild(audioElement);
      }
    };
    
  } catch (error) {
    console.error("Error:", error);
    statusDiv.textContent = 'Failed to get audio';
  }
}

// This function is now handled within speakResponse
function playLastAudio() {
  console.log("Play audio called, but this function is deprecated");
  
  // For backward compatibility, try to find and play the audio element
  const audioElement = document.getElementById('audio-player');
  if (audioElement) {
    console.log("Found audio element, playing");
    audioElement.play()
      .then(() => console.log("Playback started"))
      .catch(err => console.error("Playback error:", err));
  } else if (lastAudioBlob) {
    console.log("No audio element, but blob exists");
    const url = URL.createObjectURL(lastAudioBlob);
    const audio = new Audio(url);
    
    audio.onended = () => {
      URL.revokeObjectURL(url);
    };
    
    audio.play().catch(err => {
      console.error("Playback error:", err);
    });
  } else {
    console.error("No audio available to play");
  }
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