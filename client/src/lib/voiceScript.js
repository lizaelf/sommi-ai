// Variable to store the last audio blob for playback
let lastAudioBlob = null;
let statusDiv = null;
let lastInputWasVoice = false;
let currentAudioElement = null; // Track the currently playing audio element

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
      if (statusDiv) statusDiv.textContent = 'Processing your question...';
      
      // Set the flag to indicate voice input
      lastInputWasVoice = true;
      
      // Send the message through your chat interface
      sendMessage(transcript);
    };
    
    recognition.onend = function() {
      micButton.classList.remove('listening');
      if (statusDiv) statusDiv.textContent = '';
    };
    
    recognition.onstart = function() {
      micButton.classList.add('listening');
      if (statusDiv) statusDiv.textContent = 'Listening for your question...';
    };
    
    recognition.onerror = function(event) {
      console.error('Speech recognition error:', event.error);
      if (statusDiv) statusDiv.textContent = `Error: ${event.error}`;
      micButton.classList.remove('listening');
      lastInputWasVoice = false;
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
  
  // Set up a MutationObserver to detect when new assistant messages are added
  const conversationElement = document.getElementById('conversation');
  if (conversationElement) {
    const messageObserver = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if the last input was voice and a new assistant message was added
          if (lastInputWasVoice) {
            // Look for the newest assistant message
            const assistantMessages = conversationElement.querySelectorAll('.message.assistant[data-role="assistant"]');
            if (assistantMessages && assistantMessages.length > 0) {
              const latestMessage = assistantMessages[assistantMessages.length - 1];
              
              // Only speak if this is a new message (not already being spoken)
              if (latestMessage && !latestMessage.dataset.spoken) {
                latestMessage.dataset.spoken = 'true';
                
                // Small delay to ensure the DOM is fully updated
                setTimeout(() => {
                  console.log("Auto-speaking response after voice input");
                  speakResponse(latestMessage.textContent);
                  
                  // Reset the flag after handling
                  lastInputWasVoice = false;
                }, 300);
              }
            }
          }
        }
      });
    });
    
    // Start observing the conversation for changes
    messageObserver.observe(conversationElement, { 
      childList: true, 
      subtree: true 
    });
    
    console.log("Conversation observer set up for auto-speaking");
  }
  
  // Set up audio context for better audio support
  try {
    window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    console.log('Audio context created');
  } catch (e) {
    console.warn('Unable to initialize AudioContext:', e);
  }
  
  // Add test button handlers
  const testButton = document.getElementById('test-button');
  if (testButton) {
    testButton.addEventListener('click', function() {
      console.log("Test button clicked");
      const testText = "Hello, I'm your AI sommelier. This is a test of the voice system.";
      speakResponse(testText);
    });
  }
  
  const addMessageButton = document.getElementById('add-message');
  if (addMessageButton) {
    addMessageButton.addEventListener('click', function() {
      console.log("Adding test message");
      lastInputWasVoice = true; // Simulate voice input
      const conversation = document.getElementById('conversation');
      if (conversation) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message assistant';
        messageDiv.setAttribute('data-role', 'assistant');
        messageDiv.textContent = "This is a test response about wine. Cabernet Sauvignon pairs well with red meat dishes.";
        conversation.appendChild(messageDiv);
      }
    });
  }
});

// Modified version of the speakResponse function
async function speakResponse(text) {
  try {
    // Find or create a status div
    if (!statusDiv) {
      statusDiv = document.getElementById('status');
      
      // If status div still doesn't exist, create a temporary one
      if (!statusDiv) {
        console.log("Status div not found, creating a temporary one");
        const tempStatusDiv = document.createElement('div');
        tempStatusDiv.id = 'temp-status';
        tempStatusDiv.style.position = 'fixed';
        tempStatusDiv.style.bottom = '20px';
        tempStatusDiv.style.right = '20px';
        tempStatusDiv.style.padding = '8px 12px';
        tempStatusDiv.style.backgroundColor = 'rgba(0,0,0,0.7)';
        tempStatusDiv.style.color = 'white';
        tempStatusDiv.style.borderRadius = '4px';
        tempStatusDiv.style.zIndex = '1000';
        tempStatusDiv.style.fontSize = '14px';
        document.body.appendChild(tempStatusDiv);
        statusDiv = tempStatusDiv;
      }
    }
    
    // Use a safe way to update text content
    if (statusDiv) {
      statusDiv.textContent = 'Getting voice response...';
    }
    
    const response = await fetch('/api/text-to-speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    
    // Save the audio blob for later use
    lastAudioBlob = await response.blob();
    console.log("Audio received:", lastAudioBlob.size, "bytes", "type:", lastAudioBlob.type);
    
    // Check if we already have an audio element playing
    if (currentAudioElement) {
      // If audio is playing, pause it and return
      if (!currentAudioElement.paused) {
        console.log("Pausing current audio");
        currentAudioElement.pause();
        if (statusDiv) statusDiv.textContent = 'Audio paused';
        return;
      } else {
        // If the same audio is paused, resume it
        console.log("Resuming current audio");
        currentAudioElement.play()
          .then(() => {
            if (statusDiv) statusDiv.textContent = 'Resuming playback...';
          })
          .catch(err => {
            console.error("Resume playback error:", err);
          });
        return;
      }
    }
    
    // Create audio element and append to document - this helps with some browser issues
    const audioElement = document.createElement('audio');
    audioElement.id = 'audio-player';
    audioElement.style.display = 'none';
    document.body.appendChild(audioElement);
    
    // Store reference to current audio element
    currentAudioElement = audioElement;
    
    // Create object URL
    const url = URL.createObjectURL(lastAudioBlob);
    audioElement.src = url;
    
    // Always attempt to auto-play audio
    console.log("Attempting to auto-play audio response");
    try {
      await audioElement.play();
      if (statusDiv) statusDiv.textContent = 'Speaking...';
    } catch (playError) {
      console.error("Auto-play failed:", playError);
      
      // Create a temporary play button if auto-play fails
      const tempButton = document.createElement('button');
      tempButton.textContent = '🔊 Play Audio (auto-play failed)';
      tempButton.style.position = 'fixed';
      tempButton.style.bottom = '80px';
      tempButton.style.right = '20px';
      tempButton.style.backgroundColor = '#8B0000';
      tempButton.style.color = 'white';
      tempButton.style.padding = '10px 15px';
      tempButton.style.border = 'none';
      tempButton.style.borderRadius = '5px';
      tempButton.style.zIndex = '1000';
      tempButton.style.cursor = 'pointer';
      
      tempButton.onclick = () => {
        audioElement.play()
          .then(() => {
            if (statusDiv) statusDiv.textContent = 'Playing...';
          })
          .catch(err => {
            console.error("Manual playback error:", err);
          });
        document.body.removeChild(tempButton);
      };
      
      document.body.appendChild(tempButton);
      
      if (statusDiv) statusDiv.textContent = 'Auto-play failed. Click the button to play.';
    }
    
    // Global play button is now removed since we auto-play audio
    
    // Clean up URL object when audio ends
    audioElement.onended = () => {
      URL.revokeObjectURL(url);
      if (statusDiv) statusDiv.textContent = '';
      
      // Reset the current audio element reference
      currentAudioElement = null;
      
      // Remove the audio element
      if (audioElement.parentNode) {
        audioElement.parentNode.removeChild(audioElement);
      }
      
      // Remove temporary status div if we created one
      const tempStatusDiv = document.getElementById('temp-status');
      if (tempStatusDiv && tempStatusDiv.parentNode) {
        tempStatusDiv.parentNode.removeChild(tempStatusDiv);
      }
    };
    
  } catch (error) {
    console.error("Error:", error);
    if (statusDiv) statusDiv.textContent = 'Failed to get audio';
  }
}

// Helper function to send a message and handle the response
function sendMessage(text) {
  console.log("Sending message:", text);
  
  // Create user message element
  const conversation = document.getElementById('conversation');
  if (conversation) {
    // Add user message
    const userMessage = document.createElement('div');
    userMessage.className = 'message user';
    userMessage.setAttribute('data-role', 'user');
    userMessage.textContent = text;
    conversation.appendChild(userMessage);
    
    // Show loading indicator
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'message assistant loading';
    loadingMessage.textContent = 'Thinking...';
    conversation.appendChild(loadingMessage);
    
    // Call your AI API
    fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: text })
    })
    .then(response => response.json())
    .then(data => {
      // Remove loading indicator
      loadingMessage.remove();
      
      // Add AI response
      const assistantMessage = document.createElement('div');
      assistantMessage.className = 'message assistant';
      assistantMessage.setAttribute('data-role', 'assistant');
      assistantMessage.textContent = data.response;
      conversation.appendChild(assistantMessage);
      
      // The MutationObserver will handle speaking the response
      // if lastInputWasVoice is true
    })
    .catch(error => {
      console.error('Error calling chat API:', error);
      loadingMessage.textContent = 'Error: Failed to get response';
      loadingMessage.className = 'message error';
    });
  }
  
  // Dispatch event for frameworks like React
  const event = new CustomEvent('voiceMessage', { detail: { text } });
  document.dispatchEvent(event);
}

// This function is primarily handled by the MutationObserver now
// but kept for backward compatibility
function speakLastAssistantMessage() {
  try {
    console.log("Finding message to speak manually...");
    
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
    playLastAudio: function() { console.log("This function is deprecated"); },
    speakLastAssistantMessage
  };
}