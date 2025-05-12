// Global variables
window.lastInputWasVoice = false;
let audioContext = null;
let statusDiv = null;
let audioDebugDiv = null;
let currentAudio = null;
let volume = 1.0;

// Initialize everything when the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log("Voice Sommelier Initializing...");
  statusDiv = document.getElementById('status');
  
  // Add audio context status at the top of the screen
  addAudioContextStatus();
  
  // Set up the mic button and speech recognition
  setupSpeechRecognition();
  
  // Initialize audio context
  initAudioContext(false);
  
  // Add the speak last response button to the controls section
  addSpeakLastResponseButton();
  
  // Set up volume control if it exists
  const volumeControl = document.getElementById('volume-control');
  if (volumeControl) {
    volumeControl.addEventListener('input', function() {
      volume = parseFloat(this.value);
      updateDebugStatus(`Volume set to ${volume}`);
      if (currentAudio) currentAudio.volume = volume;
    });
  }
  
  // Add test buttons functionality
  setupTestButtons();
  
  // Add debug interface if it doesn't exist
  addDebugInterface();
  
  updateDebugStatus('Voice assistant initialized');
});

// Add audio context status indicator at the top of the screen
function addAudioContextStatus() {
  const statusBar = document.createElement('div');
  statusBar.id = 'audio-context-status';
  statusBar.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: #333; color: white; padding: 5px 10px; text-align: center; font-size: 12px; z-index: 9999;';
  statusBar.innerHTML = 'Audio Context: <span id="audio-status-value">Initializing...</span>';
  document.body.appendChild(statusBar);
  
  // Function to update the status
  window.updateAudioContextStatus = function(state) {
    const statusValue = document.getElementById('audio-status-value');
    if (statusValue) {
      statusValue.textContent = state;
      statusValue.style.color = (state === 'running') ? '#4CAF50' : '#FF5722';
    }
  };
}

// Add speak last response button to the controls area
function addSpeakLastResponseButton() {
  // Find the controls container
  const controlsContainer = document.querySelector('.controls');
  
  if (controlsContainer) {
    // Create the button
    const speakLastBtn = document.createElement('button');
    speakLastBtn.id = 'speak-last-btn';
    speakLastBtn.innerHTML = '🔊 Speak Last Response';
    speakLastBtn.style.marginLeft = '10px';
    
    // Add click handler
    speakLastBtn.addEventListener('click', function() {
      const conversation = document.getElementById('conversation');
      if (conversation) {
        const messages = conversation.querySelectorAll('.message.assistant');
        if (messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          window.speakDirectly(lastMessage.textContent);
        }
      }
    });
    
    // Add to the controls
    controlsContainer.appendChild(speakLastBtn);
  } else {
    // If no controls container exists, add it near the top
    const speakLastBtn = document.createElement('button');
    speakLastBtn.id = 'speak-last-btn';
    speakLastBtn.innerHTML = '🔊 Speak Last Response';
    speakLastBtn.style.cssText = 'position: fixed; top: 40px; right: 20px; background: #8B0000; color: white; padding: 10px; border: none; border-radius: 5px; z-index: 9998; cursor: pointer;';
    
    speakLastBtn.onclick = function() {
      const conversation = document.getElementById('conversation');
      if (conversation) {
        const messages = conversation.querySelectorAll('.message.assistant');
        if (messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          window.speakDirectly(lastMessage.textContent);
        }
      }
    };
    
    document.body.appendChild(speakLastBtn);
  }
}

// Add debug interface if it doesn't exist
function addDebugInterface() {
  if (!document.getElementById('audio-debug')) {
    const debugDiv = document.createElement('div');
    debugDiv.innerHTML = `
      <div style="position: fixed; bottom: 10px; left: 10px; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px; color: white; font-size: 12px; z-index: 1000;">
        <div id="audio-debug">Audio Status: Not initialized</div>
        <button id="simulate-voice">Simulate Voice Question</button>
        <div>
          <label for="volume-control">Volume:</label>
          <input type="range" id="volume-control" min="0" max="1" step="0.1" value="1">
        </div>
      </div>
    `;
    document.body.appendChild(debugDiv);
    
    // Initialize the references again
    audioDebugDiv = document.getElementById('audio-debug');
    
    // Add event listeners to the newly created buttons
    setupTestButtons();
  }
}

// Set up the test buttons
function setupTestButtons() {
  // Test browser speech
  const testBrowserSpeech = document.getElementById('test-browser-speech');
  if (testBrowserSpeech) {
    testBrowserSpeech.addEventListener('click', function() {
      updateDebugStatus('Testing browser speech...');
      const utterance = new SpeechSynthesisUtterance('Hello, I am the sommelier voice assistant. Can you hear me?');
      utterance.volume = volume;
      utterance.onend = () => updateDebugStatus('Browser speech test complete');
      window.speechSynthesis.speak(utterance);
    });
  }
  
  // Initialize audio context
  const testAudioContext = document.getElementById('test-audio-context');
  if (testAudioContext) {
    testAudioContext.addEventListener('click', function() {
      initAudioContext(true);
    });
  }
  
  // Simulate voice question
  const simulateVoiceBtn = document.getElementById('simulate-voice');
  if (simulateVoiceBtn) {
    simulateVoiceBtn.addEventListener('click', function() {
      updateDebugStatus("Simulating voice query");
      window.lastInputWasVoice = true; // Explicitly set this
      sendMessage("What wine pairs well with grilled salmon?");
    });
  }
}

// Initialize audio context
function initAudioContext(force) {
  if (!audioContext || force) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioContext();
      
      // Resume the context (needed for newer browsers)
      audioContext.resume().then(() => {
        updateDebugStatus(`Audio context initialized. State: ${audioContext.state}`);
        
        // Update the status bar at the top
        if (window.updateAudioContextStatus) {
          window.updateAudioContextStatus(audioContext.state);
        }
        
        // Create and play a silent sound to fully activate audio
        const silentOscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0.001; // Virtually silent
        silentOscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        silentOscillator.start();
        silentOscillator.stop(audioContext.currentTime + 0.001);
      }).catch(e => {
        updateDebugStatus(`Failed to resume audio context: ${e.message}`);
        if (window.updateAudioContextStatus) {
          window.updateAudioContextStatus('failed');
        }
      });
    } catch (e) {
      updateDebugStatus(`Audio context creation failed: ${e.message}`);
      if (window.updateAudioContextStatus) {
        window.updateAudioContextStatus('error');
      }
    }
  } else if (audioContext.state === 'suspended') {
    audioContext.resume().then(() => {
      updateDebugStatus(`Audio context resumed. State: ${audioContext.state}`);
      if (window.updateAudioContextStatus) {
        window.updateAudioContextStatus(audioContext.state);
      }
    });
  }
}

// Direct speak function to bypass all the complexity
window.speakDirectly = function(text) {
  console.log("DIRECT SPEAK REQUEST:", text.substring(0, 30) + "...");
  updateDebugStatus("Direct speak request received");
  
  // Attempt OpenAI TTS first
  fetch('/api/text-to-speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  })
  .then(response => {
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    return response.blob();
  })
  .then(blob => {
    console.log("Audio received: Size =", blob.size, "bytes");
    updateDebugStatus(`Audio received: ${blob.size} bytes`);
    
    // Create and directly play the audio
    const audio = new Audio();
    audio.src = URL.createObjectURL(blob);
    
    // Force audio to play with user interaction (needed for first play)
    const playPromise = audio.play();
    if (playPromise) {
      playPromise.then(() => {
        updateDebugStatus("Audio playing successfully");
      }).catch(error => {
        console.error("Auto-play failed:", error);
        updateDebugStatus("Auto-play failed - manual play required");
        
        // Show a very visible play button if autoplay fails
        const playButton = document.createElement('button');
        playButton.textContent = '▶️ Play Voice Response';
        playButton.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #ff0000; color: white; font-size: 20px; padding: 20px; border: none; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.5); z-index: 9999; cursor: pointer;';
        
        playButton.onclick = function() {
          audio.play();
          document.body.removeChild(playButton);
        };
        
        document.body.appendChild(playButton);
      });
    }
  })
  .catch(error => {
    console.error("Error playing audio:", error);
    updateDebugStatus(`Error playing audio: ${error.message}`);
    
    // Fallback to browser's speech synthesis
    if ('speechSynthesis' in window) {
      updateDebugStatus("Falling back to browser speech synthesis");
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  });
};

// Set up speech recognition
function setupSpeechRecognition() {
  const micButton = document.getElementById('mic-button');
  if (!micButton) {
    updateDebugStatus('Microphone button not found');
    return;
  }
  
  let recognition = null;
  if (window.SpeechRecognition || window.webkitSpeechRecognition) {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    // Define what happens when speech is recognized
    recognition.onresult = function(event) {
      const transcript = event.results[0][0].transcript;
      updateDebugStatus(`Voice input recognized: "${transcript}"`);
      
      // CRITICAL: Set flag to true for voice response
      window.lastInputWasVoice = true;
      console.log("VOICE INPUT DETECTED - Will speak response");
      
      if (statusDiv) statusDiv.textContent = 'Processing your question...';
      
      // Send the message
      sendMessage(transcript);
    };
    
    // Handle recognition end
    recognition.onend = function() {
      micButton.classList.remove('listening');
      if (statusDiv) statusDiv.textContent = '';
    };
    
    // Handle recognition start
    recognition.onstart = function() {
      micButton.classList.add('listening');
      if (statusDiv) statusDiv.textContent = 'Listening for your question...';
      updateDebugStatus('Listening for voice input...');
    };
    
    // Handle recognition errors
    recognition.onerror = function(event) {
      console.error('Speech recognition error:', event.error);
      if (statusDiv) statusDiv.textContent = `Error: ${event.error}`;
      micButton.classList.remove('listening');
      updateDebugStatus(`Recognition error: ${event.error}`);
      window.lastInputWasVoice = false;
    };
    
    // Set up microphone button click handler
    micButton.addEventListener('click', function() {
      // Force audio context initialization on click
      initAudioContext(true);
      
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
  } else {
    micButton.disabled = true;
    updateDebugStatus('Speech recognition not supported in this browser');
  }
}

// Send message to the AI
function sendMessage(text) {
  const formattedQuestion = text.trim();
  
  if (!formattedQuestion) {
    return;
  }
  
  // Find the submit function from the React app
  if (typeof window.voiceAssistant?.sendMessage === 'function') {
    window.voiceAssistant.sendMessage(formattedQuestion);
  } else {
    // Fallback for testing
    console.log("Using fallback message handling (no React integration available)");
    updateDebugStatus("Using fallback API request");
    
    // Use a fallback API call for testing
    fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: formattedQuestion }),
    })
    .then(response => response.json())
    .then(data => {
      // Update status
      updateDebugStatus("Response received from server");
      
      // If lastInputWasVoice is true, automatically speak the response
      if (window.lastInputWasVoice) {
        window.speakDirectly(data.response || "I'm sorry, I couldn't process your request.");
      } else {
        updateDebugStatus("Not auto-speaking response (not a voice query)");
      }
    })
    .catch(error => {
      console.error('Error:', error);
      updateDebugStatus(`API error: ${error.message}`);
    });
  }
}

// Handle the AI's response
async function playResponse(text) {
  if (!text) return;
  
  try {
    // First check if the user used voice input
    if (window.lastInputWasVoice) {
      updateDebugStatus('Voice input detected, speaking response...');
      
      try {
        // Try to use our direct speak method first
        if (typeof window.speakDirectly === 'function') {
          window.speakDirectly(text);
          return;
        }
        
        // Otherwise use our OpenAI TTS method
        await playWithOpenAITTS(text);
      } catch (e) {
        console.error("OpenAI TTS failed:", e);
        updateDebugStatus("OpenAI TTS failed, using browser speech");
        // Fallback to browser speech
        await playWithBrowserSpeech(text);
      }
    } else {
      updateDebugStatus('Not speaking response (not a voice query)');
    }
  } catch (e) {
    console.error("Voice response error:", e);
    updateDebugStatus(`Voice response error: ${e.message}`);
  }
}

// Play audio using OpenAI TTS
async function playWithOpenAITTS(text) {
  if (statusDiv) statusDiv.textContent = 'Getting voice response...';
  updateDebugStatus('Requesting TTS from server...');
  
  try {
    const response = await fetch('/api/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    const audioBlob = await response.blob();
    if (!audioBlob || audioBlob.size === 0) {
      throw new Error('Empty audio received from server');
    }
    
    updateDebugStatus(`Audio received: ${audioBlob.size} bytes`);
    
    // Create audio element and play
    const audio = new Audio();
    audio.src = URL.createObjectURL(audioBlob);
    
    // Set volume
    audio.volume = volume;
    
    // Keep reference to current audio
    currentAudio = audio;
    
    // Handle playback
    audio.onended = () => {
      if (statusDiv) statusDiv.textContent = '';
      updateDebugStatus('TTS playback complete');
    };
    
    // Play and handle errors
    try {
      await audio.play();
      updateDebugStatus('TTS playing...');
    } catch (playError) {
      console.error('Autoplay prevented:', playError);
      updateDebugStatus('Autoplay prevented - showing play button');
      showPlayButton(audio);
    }
  } catch (error) {
    console.error('TTS Error:', error);
    updateDebugStatus(`TTS Error: ${error.message}`);
    throw error; // Rethrow for fallback handling
  } finally {
    if (statusDiv) statusDiv.textContent = '';
  }
}

// Fallback to browser's speech synthesis
async function playWithBrowserSpeech(text) {
  updateDebugStatus('Using browser speech synthesis');
  return new Promise((resolve, reject) => {
    try {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Browser speech synthesis not supported'));
        return;
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = volume;
      
      utterance.onend = () => {
        updateDebugStatus('Browser speech complete');
        resolve();
      };
      
      utterance.onerror = (event) => {
        updateDebugStatus(`Browser speech error: ${event.error}`);
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };
      
      window.speechSynthesis.speak(utterance);
      updateDebugStatus('Browser speech playing...');
    } catch (error) {
      updateDebugStatus(`Browser speech initialization error: ${error.message}`);
      reject(error);
    }
  });
}

// Show manual play button when autoplay fails
function showPlayButton(audio) {
  const playButton = document.createElement('button');
  playButton.textContent = '▶️ Play Voice Response';
  playButton.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #ff0000; color: white; padding: 10px 20px; border: none; border-radius: 8px; z-index: 9999; cursor: pointer; font-size: 16px;';
  
  playButton.onclick = () => {
    audio.play()
      .then(() => {
        updateDebugStatus('Manual play successful');
      })
      .catch(error => {
        updateDebugStatus(`Manual play failed: ${error.message}`);
      });
    document.body.removeChild(playButton);
  };
  
  document.body.appendChild(playButton);
}

// Update debug status display
function updateDebugStatus(message) {
  if (audioDebugDiv) {
    audioDebugDiv.textContent = `Audio Status: ${message}`;
  }
  
  console.log("Voice Assistant:", message);
}

// Check if audio context is initialized when window loads
window.addEventListener('DOMContentLoaded', () => {
  if (audioContext) {
    console.log("Audio context started successfully");
    updateDebugStatus('Audio context initialized on page load');
  }
});

// Initialize audio context when user interacts with the page
window.addEventListener('click', () => {
  initAudioContext(false);
  console.log("Audio context initialized on user interaction");
});

// Initialize everything when the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log("Voice Sommelier Initializing...");
  statusDiv = document.getElementById('status');
  audioDebugDiv = document.getElementById('audio-debug');
  
  // Set up the mic button and speech recognition
  setupSpeechRecognition();
  
  // Initialize audio context
  initAudioContext(false);
  
  // Set up volume control if it exists
  const volumeControl = document.getElementById('volume-control');
  if (volumeControl) {
    volumeControl.addEventListener('input', function() {
      volume = parseFloat(this.value);
      updateDebugStatus(`Volume set to ${volume}`);
      if (currentAudio) currentAudio.volume = volume;
    });
  }
  
  // Add test buttons functionality
  setupTestButtons();
  
  // Add debug interface if it doesn't exist
  addDebugInterface();
  
  updateDebugStatus('Voice assistant initialized');
});

// Add debug interface if it doesn't exist
function addDebugInterface() {
  if (!document.getElementById('audio-debug')) {
    const debugDiv = document.createElement('div');
    debugDiv.innerHTML = `
      <div style="position: fixed; top: 10px; left: 10px; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px; color: white; font-size: 12px; z-index: 1000;">
        <div id="audio-debug">Audio Status: Not initialized</div>
        <button id="test-browser-speech">Test Browser Speech</button>
        <button id="test-audio-context">Initialize Audio</button>
        <button id="simulate-voice">Simulate Voice Question</button>
        <div>
          <label for="volume-control">Volume:</label>
          <input type="range" id="volume-control" min="0" max="1" step="0.1" value="1">
        </div>
      </div>
    `;
    document.body.appendChild(debugDiv);
    
    // Initialize the references again
    audioDebugDiv = document.getElementById('audio-debug');
    
    // Add event listeners to the newly created buttons
    setupTestButtons();
  }
}

// Set up the test buttons
function setupTestButtons() {
  // Test browser speech
  const testBrowserSpeech = document.getElementById('test-browser-speech');
  if (testBrowserSpeech) {
    testBrowserSpeech.addEventListener('click', function() {
      updateDebugStatus('Testing browser speech...');
      const utterance = new SpeechSynthesisUtterance('Hello, I am the sommelier voice assistant. Can you hear me?');
      utterance.volume = volume;
      utterance.onend = () => updateDebugStatus('Browser speech test complete');
      window.speechSynthesis.speak(utterance);
    });
  }
  
  // Initialize audio context
  const testAudioContext = document.getElementById('test-audio-context');
  if (testAudioContext) {
    testAudioContext.addEventListener('click', function() {
      initAudioContext(true);
    });
  }
  
  // Simulate voice question
  const simulateVoiceBtn = document.getElementById('simulate-voice');
  if (simulateVoiceBtn) {
    simulateVoiceBtn.addEventListener('click', function() {
      updateDebugStatus("Simulating voice query");
      window.lastInputWasVoice = true; // Explicitly set this
      sendMessage("What wine pairs well with grilled salmon?");
    });
  }
}

// Initialize audio context
function initAudioContext(force) {
  if (!audioContext || force) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioContext();
      
      // Resume the context (needed for newer browsers)
      audioContext.resume().then(() => {
        updateDebugStatus(`Audio context initialized. State: ${audioContext.state}`);
        
        // Create and play a silent sound to fully activate audio
        const silentOscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0.001; // Virtually silent
        silentOscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        silentOscillator.start();
        silentOscillator.stop(audioContext.currentTime + 0.001);
      }).catch(e => {
        updateDebugStatus(`Failed to resume audio context: ${e.message}`);
      });
    } catch (e) {
      updateDebugStatus(`Audio context creation failed: ${e.message}`);
    }
  } else if (audioContext.state === 'suspended') {
    audioContext.resume().then(() => {
      updateDebugStatus(`Audio context resumed. State: ${audioContext.state}`);
    });
  }
}

// Set up speech recognition
function setupSpeechRecognition() {
  const micButton = document.getElementById('mic-button');
  if (!micButton) {
    updateDebugStatus('Microphone button not found');
    return;
  }
  
  let recognition = null;
  if (window.SpeechRecognition || window.webkitSpeechRecognition) {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    // Define what happens when speech is recognized
    recognition.onresult = function(event) {
      const transcript = event.results[0][0].transcript;
      updateDebugStatus(`Voice input recognized: "${transcript}"`);
      
      // CRITICAL: Set flag to true for voice response
      window.lastInputWasVoice = true;
      console.log("VOICE INPUT DETECTED - Will speak response");
      
      if (statusDiv) statusDiv.textContent = 'Processing your question...';
      
      // Send the message
      sendMessage(transcript);
    };
    
    // Handle recognition end
    recognition.onend = function() {
      micButton.classList.remove('listening');
      if (statusDiv) statusDiv.textContent = '';
    };
    
    // Handle recognition start
    recognition.onstart = function() {
      micButton.classList.add('listening');
      if (statusDiv) statusDiv.textContent = 'Listening for your question...';
      updateDebugStatus('Listening for voice input...');
    };
    
    // Handle recognition errors
    recognition.onerror = function(event) {
      console.error('Speech recognition error:', event.error);
      if (statusDiv) statusDiv.textContent = `Error: ${event.error}`;
      micButton.classList.remove('listening');
      updateDebugStatus(`Recognition error: ${event.error}`);
      window.lastInputWasVoice = false;
    };
    
    // Set up microphone button click handler
    micButton.addEventListener('click', function() {
      // Force audio context initialization on click
      initAudioContext(true);
      
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
  } else {
    micButton.disabled = true;
    updateDebugStatus('Speech recognition not supported in this browser');
  }
}

// Send message to the AI
function sendMessage(text) {
  console.log("Sending message:", text);
  updateDebugStatus(`Sending message: "${text.substring(0, 20)}..."`);
  
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
    
    // Log voice input status
    console.log("Voice input flag is:", window.lastInputWasVoice);
    updateDebugStatus(`Voice input flag: ${window.lastInputWasVoice}`);
    
    // Call the AI API
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
      
      // Scroll to the bottom
      conversation.scrollTop = conversation.scrollHeight;
      
      // CRITICAL FIX: Directly speak the response if it was voice input
      if (window.lastInputWasVoice) {
        console.log("Speaking response to voice input:", data.response.substring(0, 30) + "...");
        updateDebugStatus("Speaking response to voice input");
        
        // Small delay to ensure message is rendered
        setTimeout(() => {
          playResponse(data.response);
        }, 300);
      }
    })
    .catch(error => {
      console.error('Error calling chat API:', error);
      loadingMessage.textContent = 'Error: Failed to get response';
      loadingMessage.className = 'message error';
      updateDebugStatus(`API error: ${error.message}`);
    });
  } else {
    updateDebugStatus("Conversation element not found");
  }
}

// Main function to play the voice response
async function playResponse(text) {
  try {
    if (statusDiv) statusDiv.textContent = 'Getting voice response...';
    updateDebugStatus('Preparing to speak response...');
    
    // Try different methods to play audio, starting with OpenAI TTS
    await playWithOpenAITTS(text)
      .catch(async e => {
        updateDebugStatus(`OpenAI TTS failed: ${e.message}, trying browser speech`);
        await playWithBrowserSpeech(text)
          .catch(e => {
            updateDebugStatus(`Browser speech failed: ${e.message}, no audio available`);
            if (statusDiv) statusDiv.textContent = 'Audio playback failed';
          });
      });
    
    // Reset voice input flag after speaking
    window.lastInputWasVoice = false;
  } catch (error) {
    console.error("Error in playResponse:", error);
    updateDebugStatus(`Playback error: ${error.message}`);
    window.lastInputWasVoice = false;
  }
}

// Play response using OpenAI TTS
async function playWithOpenAITTS(text) {
  updateDebugStatus('Fetching audio from OpenAI TTS...');
  
  const response = await fetch('/api/text-to-speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }
  
  const blob = await response.blob();
  updateDebugStatus(`Audio received: ${blob.size} bytes, type: ${blob.type}`);
  
  // Clean up any previous audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
    if (currentAudio.parentNode) {
      currentAudio.parentNode.removeChild(currentAudio);
    }
  }
  
  // Create new audio element
  currentAudio = document.createElement('audio');
  currentAudio.id = 'current-audio';
  currentAudio.volume = volume;
  document.body.appendChild(currentAudio);
  
  // Store the text for fallback
  currentAudio.dataset.text = text;
  
  // Set up event listeners
  currentAudio.addEventListener('canplaythrough', () => {
    updateDebugStatus('Audio ready to play');
  });
  
  currentAudio.addEventListener('playing', () => {
    if (statusDiv) statusDiv.textContent = 'Speaking...';
    updateDebugStatus('Audio playback started');
  });
  
  currentAudio.addEventListener('ended', () => {
    if (statusDiv) statusDiv.textContent = '';
    updateDebugStatus('Audio playback completed');
  });
  
  currentAudio.addEventListener('error', (e) => {
    updateDebugStatus(`Audio playback error: ${e.type}`);
    throw new Error('Audio playback error');
  });
  
  // Create URL and set source
  const url = URL.createObjectURL(blob);
  currentAudio.src = url;
  
  try {
    // Show play button for manual playback
    showPlayButton();
    
    // Try to autoplay
    await currentAudio.play();
    updateDebugStatus('Autoplay successful');
    
    // Clean up when playback ends
    currentAudio.onended = () => {
      URL.revokeObjectURL(url);
      if (statusDiv) statusDiv.textContent = '';
    };
  } catch (playError) {
    updateDebugStatus(`Autoplay failed: ${playError.message}. Try clicking the play button.`);
    throw new Error('Autoplay blocked by browser');
  }
}

// Fallback to browser's built-in speech synthesis
async function playWithBrowserSpeech(text) {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Browser speech synthesis not supported'));
      return;
    }
    
    updateDebugStatus('Using browser speech synthesis...');
    
    // Cancel any current speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.volume = volume;
    
    utterance.onend = () => {
      if (statusDiv) statusDiv.textContent = '';
      updateDebugStatus('Browser speech complete');
      resolve();
    };
    
    utterance.onerror = (e) => {
      updateDebugStatus(`Browser speech error: ${e.error}`);
      reject(new Error(`Speech synthesis error: ${e.error}`));
    };
    
    if (statusDiv) statusDiv.textContent = 'Speaking (browser synthesis)...';
    window.speechSynthesis.speak(utterance);
  });
}

// Show the play button for manual control
function showPlayButton() {
  const audioControls = document.getElementById('audio-controls');
  if (!audioControls) return;
  
  // Make sure the controls are visible
  audioControls.style.display = 'block';
  
  const playBtn = document.getElementById('play-audio-btn');
  if (!playBtn) return;
  
  // Replace with fresh button to remove old event listeners
  const newPlayBtn = playBtn.cloneNode(true);
  playBtn.parentNode.replaceChild(newPlayBtn, playBtn);
  
  // Style button
  newPlayBtn.style.backgroundColor = '#8B0000';
  newPlayBtn.style.color = 'white';
  newPlayBtn.style.padding = '10px 20px';
  newPlayBtn.style.border = 'none';
  newPlayBtn.style.borderRadius = '5px';
  newPlayBtn.style.cursor = 'pointer';
  newPlayBtn.style.fontWeight = 'bold';
  
  // Add click listener
  newPlayBtn.addEventListener('click', function() {
    updateDebugStatus('Manual play button clicked');
    if (currentAudio) {
      currentAudio.volume = volume;
      currentAudio.play()
        .then(() => {
          if (statusDiv) statusDiv.textContent = 'Playing...';
        })
        .catch(err => {
          updateDebugStatus(`Manual play failed: ${err.message}`);
          
          // Try browser speech as fallback
          if (currentAudio.dataset.text) {
            playWithBrowserSpeech(currentAudio.dataset.text)
              .catch(e => updateDebugStatus(`All playback methods failed: ${e.message}`));
          } else {
            updateDebugStatus('No text available for fallback');
          }
        });
    } else {
      updateDebugStatus('No audio available to play');
    }
  });
}

// Helper function to update the debug status
function updateDebugStatus(message) {
  console.log(message);
  if (audioDebugDiv) {
    audioDebugDiv.textContent = message;
  }
}

// Export the voice assistant functions for use in other scripts
window.voiceAssistant = {
  playResponse,
  initAudioContext,
  sendMessage
};