// Variables to store state for playback
let lastAudioBlob = null;
let statusDiv = null;
let lastInputWasVoice = false;
let isAudioPlaying = false;
let lastPlayedText = '';
let currentUtterance = null;
let pausedText = '';
let currentPosition = 0;
let wasMuted = false;

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
                  
                  // Get the exact text content of the message
                  const originalText = latestMessage.textContent || '';
                  
                  // Only apply minimal processing to remove markdown formatting
                  // without changing the actual content of the text
                  const speechText = processTextForSpeech(originalText);
                  
                  // Only speak if we have content after processing
                  if (speechText && speechText.trim().length > 0) {
                    console.log("Speaking message with minimal processing, length:", speechText.length);
                    speakResponse(speechText);
                  } else {
                    console.warn("No valid text to speak after processing");
                  }
                  
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
});

// speakResponse function for Listen Response functionality
async function speakResponse(text) {
  try {
    // Check if this is a resume from mute
    if (wasMuted && pausedText) {
      text = pausedText;
      wasMuted = false;
      console.log("Resuming speech from muted position");
    } else {
      // Validate text input - must be non-empty after trimming
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        console.warn("Empty or invalid text provided to speech function");
        return; // Exit early - nothing to speak
      }
      
      // Process text to ensure it's suitable for speech synthesis
      text = processTextForSpeech(text);
      
      // Check again after processing in case it removed all content
      if (!text || text.trim().length === 0) {
        console.warn("Text became empty after processing for speech");
        return; // Exit early - nothing to speak
      }
      
      // Store the full text for reference
      lastPlayedText = text;
      currentPosition = 0;
      pausedText = '';
    }
    
    // Store the text for reference
    if (!pausedText) {
      lastPlayedText = text;
    }
    
    // Log for debugging
    console.log("Speaking text response using browser synthesis...");
    
    // Force reload voices to get fresh list
    const voices = window.speechSynthesis.getVoices();
    console.log("Available voices:", voices.length);
    
    // Look for male voices - log them for debugging
    const maleVoices = voices.filter(voice => 
      voice.name.includes('Male') || 
      voice.name.includes('David') || 
      voice.name.includes('James') || 
      voice.name.includes('Thomas'));
    
    console.log("Male voices available:", maleVoices.length);
    if (maleVoices.length > 0) {
      maleVoices.forEach((v, i) => console.log(`Male voice ${i}:`, v.name));
      // Force select the LATEST (last) male voice if found
      window.selectedVoice = maleVoices[maleVoices.length - 1];
      console.log("Selected latest male voice:", window.selectedVoice.name);
    }
    
    // Use browser's built-in speech synthesis
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      // Create a new utterance
      currentUtterance = new SpeechSynthesisUtterance(text);
      currentUtterance.lang = 'en-US';
      
      // Store the selected voice in a global variable to ensure consistency
      if (!window.selectedVoice) {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          // Try to find a male voice with good quality
          window.selectedVoice = voices.find(voice => 
            (voice.name.includes('Google') && voice.name.includes('Male')) || 
            (voice.name.includes('David') || voice.name.includes('James') || 
             voice.name.includes('Thomas') || voice.name.includes('Daniel')) ||
            (voice.name.includes('US') && voice.name.includes('Male')));
            
          // If no male voice found, try any available male voice (select the latest one)
          if (!window.selectedVoice) {
            const allMaleVoices = voices.filter(voice => 
              voice.name.includes('Male'));
            if (allMaleVoices.length > 0) {
              window.selectedVoice = allMaleVoices[allMaleVoices.length - 1];
            }
          }
            
          // If still no preferred voice found, use the first available
          if (!window.selectedVoice && voices.length > 0) {
            window.selectedVoice = voices[0];
          }
          
          console.log("Selected male voice for consistent playback:", window.selectedVoice?.name || "Default");
        }
      }
      
      // Always use the same voice for consistency
      if (window.selectedVoice) {
        currentUtterance.voice = window.selectedVoice;
      }
      
      // Add speech rate and pitch for better quality
      currentUtterance.rate = 1.0;  // normal speed
      currentUtterance.pitch = 1.0; // normal pitch
      
      // Add event listeners to track speech state and position
      currentUtterance.onstart = () => {
        isAudioPlaying = true;
        wasMuted = false;
        document.dispatchEvent(new CustomEvent('audioPlaying'));
        
        // Dispatch event to notify VoiceAssistant that audio is playing
        const audioEvent = new CustomEvent('audio-status', {
          detail: { status: 'playing' }
        });
        window.dispatchEvent(audioEvent);
      };
      
      currentUtterance.onboundary = (event) => {
        // Track character position for resuming
        if (event.name === 'word') {
          currentPosition = event.charIndex;
        }
      };
      
      currentUtterance.onend = () => {
        isAudioPlaying = false;
        currentPosition = 0;
        pausedText = '';
        wasMuted = false;
        document.dispatchEvent(new CustomEvent('audioPaused'));
        
        // Dispatch event to notify VoiceAssistant that audio has stopped
        const audioEvent = new CustomEvent('audio-status', {
          detail: { status: 'stopped' }
        });
        window.dispatchEvent(audioEvent);
      };
      
      currentUtterance.onerror = (event) => {
        console.error("Speech synthesis error:", event);
        isAudioPlaying = false;
        wasMuted = false;
        
        // Dispatch event to notify VoiceAssistant that audio has stopped due to error
        const audioEvent = new CustomEvent('audio-status', {
          detail: { status: 'stopped', reason: 'error' }
        });
        window.dispatchEvent(audioEvent);
      };
      
      // Speak the text
      window.speechSynthesis.speak(currentUtterance);
    } else {
      // If browser speech synthesis isn't available, show a message
      console.warn("Browser speech synthesis not available");
    }
  } catch (error) {
    // Error handling
    console.error("TTS error:", error.message || error);
    
    // Try one more time with fallback settings
    if ('speechSynthesis' in window) {
      try {
        console.log("Using simple speech synthesis as error fallback");
        window.speechSynthesis.cancel(); // Cancel any ongoing speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
      } catch (speechError) {
        console.error("Speech synthesis error:", speechError);
      }
    }
  }
}

// Play the last spoken audio again
function playLastAudio() {
  if (lastPlayedText) {
    speakResponse(lastPlayedText);
  } else {
    console.warn("No previous audio to play");
  }
}

// Explicitly find and speak the last assistant message
function speakLastAssistantMessage() {
  try {
    const conversationElement = document.getElementById('conversation');
    if (conversationElement) {
      const assistantMessages = conversationElement.querySelectorAll('[data-role="assistant"]');
      if (assistantMessages && assistantMessages.length > 0) {
        const lastMessage = assistantMessages[assistantMessages.length - 1];
        if (lastMessage && lastMessage.textContent) {
          const messageText = lastMessage.textContent || '';
          
          // Process the text to make it suitable for speech
          const speechText = processTextForSpeech(messageText);
          
          // Speak with slight delay to ensure UI is ready
          setTimeout(() => {
            speakResponse(speechText);
          }, 100);
        }
      }
    }
  } catch (error) {
    console.error('Error finding assistant message to speak:', error);
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
      assistantMessage.textContent = data.message.content;
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
// Minimal processing to maintain exact content while just removing markdown
function processTextForSpeech(content) {
  if (!content) return '';
  
  let processedText = content;
  
  // Only remove markdown formatting - keep the actual content intact
  // Replace bold markdown formatting with plain text
  processedText = processedText.replace(/\*\*(.*?)\*\*/g, '$1');
  
  // Replace other markdown formatting that might cause issues in speech
  processedText = processedText.replace(/\*(.*?)\*/g, '$1');  // Italic
  processedText = processedText.replace(/`(.*?)`/g, '$1');    // Code
  
  // Clean up unnecessary whitespace without changing structure
  // Just convert multiple spaces to single spaces
  processedText = processedText.replace(/[ \t]+/g, ' ');
  
  return processedText;
}

// Initialize voices list early to make sure it's populated
// This is needed because browsers load voices asynchronously
if ('speechSynthesis' in window) {
  // Load voices list early 
  window.speechSynthesis.getVoices();
  
  // Add event listener for when voices are loaded
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = function() {
      // Cache the voices list when they become available
      if (!window.selectedVoice) {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          // Try to find a male voice with good quality
          window.selectedVoice = voices.find(voice => 
            (voice.name.includes('Google') && voice.name.includes('Male')) || 
            (voice.name.includes('David') || voice.name.includes('James') || 
             voice.name.includes('Thomas') || voice.name.includes('Daniel')) ||
            (voice.name.includes('US') && voice.name.includes('Male')));
            
          // If no specific male voice found, find the latest male voice
          if (!window.selectedVoice) {
            const allMaleVoices = voices.filter(voice => 
              voice.name.includes('Male'));
            if (allMaleVoices.length > 0) {
              window.selectedVoice = allMaleVoices[allMaleVoices.length - 1];
            }
          }
            
          // If still no preferred voice found, use the first available
          if (!window.selectedVoice && voices.length > 0) {
            window.selectedVoice = voices[0];
          }
          
          console.log("Voice loaded and cached for consistent playback:", window.selectedVoice?.name || "Default");
        }
      }
    };
  }
}

// Function to handle muting and save current position
function muteAndSavePosition() {
  if (isAudioPlaying && currentUtterance) {
    // Save the remaining text from current position
    if (currentPosition > 0 && lastPlayedText) {
      pausedText = lastPlayedText.substring(currentPosition);
      wasMuted = true;
      console.log("Speech muted at position:", currentPosition);
      console.log("Remaining text saved for resume");
    }
    
    // Cancel current speech
    window.speechSynthesis.cancel();
    isAudioPlaying = false;
  }
}

// Function to resume speech from where it was muted
function resumeFromMute() {
  if (wasMuted && pausedText) {
    speakResponse(pausedText);
  } else if (lastPlayedText) {
    speakResponse(lastPlayedText);
  }
}

// Expose functions to the global scope for integration with other components
window.voiceAssistant = {
  speakResponse: speakResponse,
  playLastAudio: playLastAudio,
  speakLastAssistantMessage: speakLastAssistantMessage,
  muteAndSavePosition: muteAndSavePosition,
  resumeFromMute: resumeFromMute
};