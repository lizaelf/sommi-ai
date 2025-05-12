// Variables to store state for playback
let lastAudioBlob = null;
let statusDiv = null;
let lastInputWasVoice = false;
let currentAudioElement = null;
let isAudioPlaying = false;
let lastPlayedText = '';
let loadingAnimation = null;

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
    // We don't need visible status messages anymore - handle this internally
    
    // Add loading animation if needed (only visible in developer console)
    console.log("Processing voice response...");
    
    // We'll use the audio element for state management, but no need to show status
    
    // Store the text in case we need to fall back to browser speech synthesis
    lastPlayedText = text;
    
    // Try to get audio from OpenAI TTS API
    const response = await fetch('/api/text-to-speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    
    // If the API request failed (including quota exceeded)
    if (!response.ok) {
      console.log(`TTS API error: ${response.status}. Using browser fallback if available.`);
      
      // Try browser's built-in speech synthesis as fallback
      if ('speechSynthesis' in window) {
        console.log("Using browser speech synthesis as fallback");
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
        
        // Create a fake "blob" to indicate we have audio (even though it's browser-based)
        lastAudioBlob = new Blob(['fallback'], { type: 'audio/mpeg' });
        
        // Dispatch event to update UI
        document.dispatchEvent(new CustomEvent('audioPlaying'));
        
        // No need to continue with the rest of the function
        return;
      }
      
      // If browser speech synthesis isn't available either
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    // Save the audio blob for later use
    lastAudioBlob = await response.blob();
    console.log("Audio received:", lastAudioBlob.size, "bytes", "type:", lastAudioBlob.type);
    
    // Properly handle existing audio element before creating a new one
    if (currentAudioElement) {
      try {
        // If this is a new audio request (different text), stop the current one
        console.log("Stopping previous audio playback");
        currentAudioElement.pause();
        // Reset playback position
        currentAudioElement.currentTime = 0;
        
        // Clean up if we're creating a new audio element
        if (text !== lastPlayedText) {
          if (currentAudioElement.parentNode) {
            currentAudioElement.parentNode.removeChild(currentAudioElement);
          }
          currentAudioElement = null;
          isAudioPlaying = false;
        }
      } catch (err) {
        console.warn("Error cleaning up previous audio:", err);
      }
    }
    
    // Create new audio element if needed
    if (!currentAudioElement) {
      // Create audio element and append to document - this helps with some browser issues
      const audioElement = document.createElement('audio');
      audioElement.id = 'audio-player';
      audioElement.style.display = 'none';
      document.body.appendChild(audioElement);
      
      // Create object URL
      const url = URL.createObjectURL(lastAudioBlob);
      audioElement.src = url;
      
      // Store reference to current audio element
      currentAudioElement = audioElement;
      
      // Remember text that's being played for comparison
      lastPlayedText = text;
    }
    
    // Always auto-play, regardless of input method
    console.log("Auto-playing audio response");
    try {
      // Auto-play immediately
      await audioElement.play();
      isAudioPlaying = true;
    } catch (playError) {
      console.error("Auto-play failed:", playError);
      isAudioPlaying = false;
      
      // Keep the hidden audio controls for accessibility and fallback
      const audioControls = document.getElementById('audio-controls');
      if (audioControls) {
        audioControls.style.display = 'none';
      }
    }
    
    // Set up keyboard shortcut for play/pause
    document.addEventListener('keydown', function(e) {
      // Space key to toggle play/pause but only if no input element has focus
      if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT' && 
          document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault(); // Prevent page scroll
        
        if (currentAudioElement) {
          // Toggle playback
          if (isAudioPlaying && !currentAudioElement.paused) {
            currentAudioElement.pause();
            isAudioPlaying = false;
          } else {
            currentAudioElement.play()
              .then(() => {
                isAudioPlaying = true;
              })
              .catch(err => console.error("Audio playback error:", err));
          }
        }
      }
    });
    
    // Setup hidden play button if available (for accessibility)
    const playBtn = document.getElementById('play-audio-btn');
    if (playBtn) {
      // Set a unique ID based on the current text
      const buttonId = 'audio-btn-' + text.substring(0, 20).replace(/\W+/g, '-');
      playBtn.id = buttonId;
      
      // Add event listener for play/pause toggle
      playBtn.addEventListener('click', function() {
        // Handle play/pause toggle
        if (currentAudioElement) {
          if (isAudioPlaying && !currentAudioElement.paused) {
            console.log("Pausing audio playback");
            currentAudioElement.pause();
            isAudioPlaying = false;
          } else {
            console.log("Play/resume button clicked");
            currentAudioElement.play()
              .then(() => {
                console.log("Audio playback started successfully");
                isAudioPlaying = true;
              })
              .catch(err => {
                console.error("Audio playback error:", err);
                isAudioPlaying = false;
                
                // Fallback to browser's built-in speech synthesis
                if ('speechSynthesis' in window) {
                  console.log("Trying browser speech synthesis");
                  const utterance = new SpeechSynthesisUtterance(text);
                  utterance.lang = 'en-US';
                  window.speechSynthesis.speak(utterance);
                }
              });
          }
        }
      });
    }
    
    // Clean up when audio ends
    audioElement.onended = () => {
      // Revoke the object URL to free memory
      const url = audioElement.src;
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
      
      // Reset play state
      isAudioPlaying = false;
      
      // Don't remove the audio element - keep it for replay
    };
    
  } catch (error) {
    console.error("Error:", error);
    // Don't show error message in UI, just log to console
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

// Helper function to process text for speech
function processTextForSpeech(content) {
  if (!content) return '';
  
  // Simplistic approach to remove emoji symbols - without unicode flag
  let cleanText = content;
  
  // Remove common emoji & non-ASCII characters
  cleanText = cleanText.replace(/[^\x00-\x7F]/g, '');
  
  // Replace markdown formatting for bold with standard text
  cleanText = cleanText.replace(/\*\*(.*?)\*\*/g, '$1');
  
  // Replace bullet points with pauses and cleaner structure
  cleanText = cleanText.replace(/- /g, '. ');
  
  // Clean up double spaces and unnecessary whitespace
  return cleanText.replace(/\s+/g, ' ').trim();
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
          // Get the raw text content
          const messageText = lastMessage.textContent || '';
          console.log("Found message to speak:", messageText.substring(0, 50) + "...");
          
          // Process the text to make it more suitable for speech
          const speechText = processTextForSpeech(messageText);
          
          // Speak the response with a small delay to ensure message is fully rendered
          setTimeout(() => {
            speakResponse(speechText);
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

// Function to play or pause the last audio
function playLastAudio() {
  // If no audio is available, return
  if (!lastAudioBlob) {
    console.error("No audio available");
    return;
  }
  
  // If we already have an audio element
  if (currentAudioElement) {
    if (!currentAudioElement.paused) {
      // It's already playing, pause it
      console.log("Pausing current audio");
      currentAudioElement.pause();
      isAudioPlaying = false;
      
      // Dispatch an event so React components can update
      document.dispatchEvent(new CustomEvent('audioPaused'));
      
      return;
    } else {
      // It's paused, resume it
      console.log("Resuming paused audio");
      currentAudioElement.play()
        .then(() => {
          console.log("Audio playback resumed");
          isAudioPlaying = true;
          
          // Dispatch an event so React components can update
          document.dispatchEvent(new CustomEvent('audioPlaying'));
        })
        .catch(err => {
          console.error("Playback resume error:", err);
          isAudioPlaying = false;
        });
      return;
    }
  }
  
  // If we get here, we need to create a new audio element
  console.log("Creating new audio player from stored blob");
  const url = URL.createObjectURL(lastAudioBlob);
  currentAudioElement = new Audio(url);
  currentAudioElement.id = 'audio-player';
  
  // Set up event listeners
  currentAudioElement.onended = () => {
    console.log("Audio playback finished");
    URL.revokeObjectURL(url);
    isAudioPlaying = false;
    
    // Dispatch an event that React can listen to
    document.dispatchEvent(new CustomEvent('audioEnded'));
  };
  
  // Start playback
  currentAudioElement.play()
    .then(() => {
      console.log("Audio playback started");
      isAudioPlaying = true;
      
      // Dispatch an event that React can listen to
      document.dispatchEvent(new CustomEvent('audioPlaying'));
    })
    .catch(err => {
      console.error("Playback error:", err);
      isAudioPlaying = false;
    });
}

// Export functions for use in React components if needed
if (typeof window !== 'undefined') {
  window.voiceAssistant = {
    speakResponse,
    playLastAudio, // Use the actual function now
    speakLastAssistantMessage
  };
}