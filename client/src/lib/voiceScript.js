// Variables to store state for playback
let lastAudioBlob = null;
let statusDiv = null;
let lastInputWasVoice = false;
let isAudioPlaying = false;
let lastPlayedText = "";
let currentUtterance = null;
let pausedText = "";
let currentPosition = 0;
let wasMuted = false;

// CRITICAL: Voice locking variables
let isVoiceLocked = false;
let lockedMaleVoice = null;
let voiceInitializationAttempts = 0;
const MAX_VOICE_INIT_ATTEMPTS = 10;

// DOM load event to initialize everything
document.addEventListener("DOMContentLoaded", function () {
  // Get the microphone button and status div
  const micButton = document.getElementById("mic-button");
  statusDiv = document.getElementById("status");

  // Initialize voice system FIRST
  initializeVoiceSystem();

  // Speech recognition setup
  let recognition = null;
  if (window.SpeechRecognition || window.webkitSpeechRecognition) {
    recognition = new (window.SpeechRecognition ||
      window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = function (event) {
      const transcript = event.results[0][0].transcript;
      if (statusDiv) statusDiv.textContent = "Processing your question...";

      // Set the flag to indicate voice input
      lastInputWasVoice = true;

      // Send the message through your chat interface
      sendMessage(transcript);
    };

    recognition.onend = function () {
      micButton.classList.remove("listening");
      if (statusDiv) statusDiv.textContent = "";
    };

    recognition.onstart = function () {
      micButton.classList.add("listening");
      if (statusDiv) statusDiv.textContent = "Listening for your question...";
    };

    recognition.onerror = function (event) {
      console.error("Speech recognition error:", event.error);
      if (statusDiv) statusDiv.textContent = `Error: ${event.error}`;
      micButton.classList.remove("listening");
      lastInputWasVoice = false;
    };
  }

  // Microphone button click handler
  if (micButton) {
    micButton.addEventListener("click", function () {
      if (!recognition) {
        alert(
          "Your browser doesn't support speech recognition. Try using Chrome.",
        );
        return;
      }

      if (micButton.classList.contains("listening")) {
        recognition.stop();
      } else {
        try {
          recognition.start();
        } catch (error) {
          console.error("Failed to start speech recognition:", error);
          alert("Failed to start speech recognition. Please try again.");
        }
      }
    });
  }

  // Set up a MutationObserver to detect when new assistant messages are added
  const conversationElement = document.getElementById("conversation");
  if (conversationElement) {
    const messageObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          // Check if the last input was voice and a new assistant message was added
          if (lastInputWasVoice) {
            // Look for the newest assistant message
            const assistantMessages = conversationElement.querySelectorAll(
              '.message.assistant[data-role="assistant"]',
            );
            if (assistantMessages && assistantMessages.length > 0) {
              const latestMessage =
                assistantMessages[assistantMessages.length - 1];

              // Only speak if this is a new message (not already being spoken)
              if (latestMessage && !latestMessage.dataset.spoken) {
                latestMessage.dataset.spoken = "true";

                // Small delay to ensure the DOM is fully updated
                setTimeout(() => {
                  console.log("Auto-speaking response after voice input");

                  // Get the exact text content of the message
                  const originalText = latestMessage.textContent || "";

                  // Only apply minimal processing to remove markdown formatting
                  // without changing the actual content of the text
                  const speechText = processTextForSpeech(originalText);

                  // Only speak if we have content after processing
                  if (speechText && speechText.trim().length > 0) {
                    console.log(
                      "Speaking message with minimal processing, length:",
                      speechText.length,
                    );
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
      subtree: true,
    });

    console.log("Conversation observer set up for auto-speaking");
  }

  // Set up audio context for better audio support
  try {
    window.audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    console.log("Audio context created");
  } catch (e) {
    console.warn("Unable to initialize AudioContext:", e);
  }

  // Add test button handlers
  const testButton = document.getElementById("test-button");
  if (testButton) {
    testButton.addEventListener("click", function () {
      console.log("Test button clicked");
      const testText =
        "Hello, I'm your AI sommelier. This is a test of the voice system.";
      speakResponse(testText);
    });
  }
});

// CRITICAL: Robust voice system initialization
function initializeVoiceSystem() {
  console.log("🎙️ VOICE INIT: Starting voice system initialization");

  if (!("speechSynthesis" in window)) {
    console.error("🎙️ VOICE ERROR: Speech synthesis not supported");
    return;
  }

  // Attempt to lock voice with retry mechanism
  const attemptVoiceLock = () => {
    voiceInitializationAttempts++;
    console.log(
      `🎙️ VOICE INIT: Attempt ${voiceInitializationAttempts}/${MAX_VOICE_INIT_ATTEMPTS}`,
    );

    const voices = window.speechSynthesis.getVoices();

    if (voices.length === 0) {
      console.log("🎙️ VOICE INIT: No voices loaded yet, waiting...");

      if (voiceInitializationAttempts < MAX_VOICE_INIT_ATTEMPTS) {
        setTimeout(attemptVoiceLock, 100);
      } else {
        console.error(
          "🎙️ VOICE ERROR: Failed to load voices after maximum attempts",
        );
      }
      return;
    }

    // Successfully got voices, now lock the male voice
    lockMaleVoice(voices);
  };

  // Start initial attempt
  attemptVoiceLock();

  // Also set up the voices changed event as backup
  window.speechSynthesis.onvoiceschanged = () => {
    if (!isVoiceLocked) {
      console.log(
        "🎙️ VOICE EVENT: Voices changed, attempting to lock male voice",
      );
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        lockMaleVoice(voices);
      }
    }
  };
}

// CRITICAL: Lock male voice with absolute priority
function lockMaleVoice(voices) {
  if (isVoiceLocked) {
    console.log("🎙️ VOICE: Already locked, skipping");
    return;
  }

  console.log("🎙️ VOICE LOCK: Starting male voice selection");
  console.log(`🎙️ VOICE LOCK: Found ${voices.length} total voices`);

  // Debug: List all voices
  voices.forEach((voice, index) => {
    console.log(
      `🎙️ VOICE ${index}: ${voice.name} (${voice.lang}) - ${voice.voiceURI}`,
    );
  });

  let selectedVoice = null;

  // PRIORITY 1: Google UK English Male (most consistent)
  selectedVoice = voices.find(
    (voice) => voice.name === "Google UK English Male",
  );
  if (selectedVoice) {
    console.log("🎙️ VOICE SELECTED: Google UK English Male (Priority 1)");
  }

  // PRIORITY 2: Google US English Male
  if (!selectedVoice) {
    selectedVoice = voices.find(
      (voice) => voice.name === "Google US English Male",
    );
    if (selectedVoice) {
      console.log("🎙️ VOICE SELECTED: Google US English Male (Priority 2)");
    }
  }

  // PRIORITY 3: Any Google voice with "Male"
  if (!selectedVoice) {
    selectedVoice = voices.find(
      (voice) =>
        voice.name.includes("Google") &&
        voice.name.toLowerCase().includes("male"),
    );
    if (selectedVoice) {
      console.log(
        "🎙️ VOICE SELECTED: Google Male voice (Priority 3):",
        selectedVoice.name,
      );
    }
  }

  // PRIORITY 4: Any voice with "Male" in name
  if (!selectedVoice) {
    selectedVoice = voices.find((voice) =>
      voice.name.toLowerCase().includes("male"),
    );
    if (selectedVoice) {
      console.log(
        "🎙️ VOICE SELECTED: Any Male voice (Priority 4):",
        selectedVoice.name,
      );
    }
  }

  // PRIORITY 5: Default English voice (avoid female)
  if (!selectedVoice) {
    selectedVoice = voices.find(
      (voice) =>
        voice.lang.startsWith("en") &&
        !voice.name.toLowerCase().includes("female") &&
        !voice.name.toLowerCase().includes("woman"),
    );
    if (selectedVoice) {
      console.log(
        "🎙️ VOICE SELECTED: Default English (Priority 5):",
        selectedVoice.name,
      );
    }
  }

  // FINAL FALLBACK: First voice
  if (!selectedVoice) {
    selectedVoice = voices[0];
    console.log(
      "🎙️ VOICE FALLBACK: Using first available voice:",
      selectedVoice.name,
    );
  }

  if (selectedVoice) {
    lockedMaleVoice = selectedVoice;
    isVoiceLocked = true;

    // Store globally
    window.selectedVoice = selectedVoice;

    console.log("🎙️ ✅ VOICE LOCKED:", selectedVoice.name);
    console.log("🎙️ ✅ Voice URI:", selectedVoice.voiceURI);
    console.log("🎙️ ✅ Voice Lang:", selectedVoice.lang);

    // Test the voice to ensure it works
    testLockedVoice();
  } else {
    console.error("🎙️ ❌ VOICE ERROR: No suitable voice found!");
  }
}

// Test the locked voice
function testLockedVoice() {
  if (!lockedMaleVoice) return;

  console.log("🎙️ TEST: Testing locked voice");
  const testUtterance = new SpeechSynthesisUtterance("Voice test");
  testUtterance.voice = lockedMaleVoice;
  testUtterance.volume = 0.1; // Very quiet test
  testUtterance.rate = 2.0; // Fast test

  testUtterance.onstart = () => {
    console.log("🎙️ ✅ TEST: Voice working correctly");
  };

  testUtterance.onerror = (event) => {
    console.error("🎙️ ❌ TEST: Voice test failed:", event.error);
    // Try to find alternative voice
    isVoiceLocked = false;
    setTimeout(() => {
      const voices = window.speechSynthesis.getVoices();
      lockMaleVoice(voices);
    }, 100);
  };

  window.speechSynthesis.speak(testUtterance);
}

// UPDATED: speakResponse function with guaranteed male voice
async function speakResponse(text) {
  try {
    // Ensure voice is locked before speaking
    if (!isVoiceLocked || !lockedMaleVoice) {
      console.log("🎙️ SPEAK: Voice not locked, initializing...");
      initializeVoiceSystem();

      // Wait a bit for voice to lock
      await new Promise((resolve) => setTimeout(resolve, 200));

      if (!lockedMaleVoice) {
        console.error("🎙️ SPEAK ERROR: Could not lock voice");
        return;
      }
    }

    // Check if this is a resume from mute
    if (wasMuted && pausedText) {
      text = pausedText;
      wasMuted = false;
      console.log("🎙️ SPEAK: Resuming speech from muted position");
    } else {
      // Validate text input
      if (!text || typeof text !== "string" || text.trim().length === 0) {
        console.warn("🎙️ SPEAK: Empty or invalid text provided");
        return;
      }

      // Process text for speech
      text = processTextForSpeech(text);

      if (!text || text.trim().length === 0) {
        console.warn("🎙️ SPEAK: Text became empty after processing");
        return;
      }

      lastPlayedText = text;
      currentPosition = 0;
      pausedText = "";
    }

    console.log(
      "🎙️ SPEAK: Speaking with locked male voice:",
      lockedMaleVoice.name,
    );

    // Use browser's speech synthesis with LOCKED voice
    if ("speechSynthesis" in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      // Create utterance with LOCKED male voice
      currentUtterance = new SpeechSynthesisUtterance(text);
      currentUtterance.voice = lockedMaleVoice; // ✅ ALWAYS use locked voice
      currentUtterance.lang = "en-US";
      currentUtterance.rate = 1.0;
      currentUtterance.pitch = 1.0;

      // Verify voice is correctly set
      if (currentUtterance.voice !== lockedMaleVoice) {
        console.error("🎙️ ❌ SPEAK ERROR: Voice assignment failed!");
        currentUtterance.voice = lockedMaleVoice; // Force again
      }

      console.log("🎙️ SPEAK: Using voice:", currentUtterance.voice.name);

      // Add event listeners
      currentUtterance.onstart = () => {
        console.log(
          "🎙️ ▶️ SPEAK: Started with voice:",
          currentUtterance.voice.name,
        );
        isAudioPlaying = true;
        wasMuted = false;
        document.dispatchEvent(new CustomEvent("audioPlaying"));

        const audioEvent = new CustomEvent("audio-status", {
          detail: { status: "playing" },
        });
        window.dispatchEvent(audioEvent);
      };

      currentUtterance.onboundary = (event) => {
        if (event.name === "word") {
          currentPosition = event.charIndex;
        }
      };

      currentUtterance.onend = () => {
        console.log("🎙️ ⏹️ SPEAK: Speech ended");
        isAudioPlaying = false;
        currentPosition = 0;
        pausedText = "";
        wasMuted = false;
        document.dispatchEvent(new CustomEvent("audioPaused"));

        const audioEvent = new CustomEvent("audio-status", {
          detail: { status: "stopped" },
        });
        window.dispatchEvent(audioEvent);
      };

      currentUtterance.onerror = (event) => {
        console.error("🎙️ ❌ SPEAK ERROR:", event.error);
        isAudioPlaying = false;
        wasMuted = false;

        const audioEvent = new CustomEvent("audio-status", {
          detail: { status: "stopped", reason: "error" },
        });
        window.dispatchEvent(audioEvent);
      };

      // Speak with locked voice
      window.speechSynthesis.speak(currentUtterance);
    } else {
      console.warn("🎙️ SPEAK: Browser speech synthesis not available");
    }
  } catch (error) {
    console.error("🎙️ SPEAK ERROR:", error.message || error);
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
    const conversationElement = document.getElementById("conversation");
    if (conversationElement) {
      const assistantMessages = conversationElement.querySelectorAll(
        '[data-role="assistant"]',
      );
      if (assistantMessages && assistantMessages.length > 0) {
        const lastMessage = assistantMessages[assistantMessages.length - 1];
        if (lastMessage && lastMessage.textContent) {
          const messageText = lastMessage.textContent || "";
          const speechText = processTextForSpeech(messageText);

          setTimeout(() => {
            speakResponse(speechText);
          }, 100);
        }
      }
    }
  } catch (error) {
    console.error("Error finding assistant message to speak:", error);
  }
}

// Helper function to send a message and handle the response
function sendMessage(text) {
  console.log("Sending message:", text);

  // Create user message element
  const conversation = document.getElementById("conversation");
  if (conversation) {
    // Add user message
    const userMessage = document.createElement("div");
    userMessage.className = "message user";
    userMessage.setAttribute("data-role", "user");
    userMessage.textContent = text;
    conversation.appendChild(userMessage);

    // Show loading indicator
    const loadingMessage = document.createElement("div");
    loadingMessage.className = "message assistant loading";
    loadingMessage.textContent = "Thinking...";
    conversation.appendChild(loadingMessage);

    // Call your AI API
    fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: text }),
    })
      .then((response) => response.json())
      .then((data) => {
        // Remove loading indicator
        loadingMessage.remove();

        // Add AI response
        const assistantMessage = document.createElement("div");
        assistantMessage.className = "message assistant";
        assistantMessage.setAttribute("data-role", "assistant");
        assistantMessage.textContent = data.message.content;
        conversation.appendChild(assistantMessage);
      })
      .catch((error) => {
        console.error("Error calling chat API:", error);
        loadingMessage.textContent = "Error: Failed to get response";
        loadingMessage.className = "message error";
      });
  }

  // Dispatch event for frameworks like React
  const event = new CustomEvent("voiceMessage", { detail: { text } });
  document.dispatchEvent(event);
}

// Helper function to process text for speech
function processTextForSpeech(content) {
  if (!content) return "";

  let processedText = content;

  // Remove markdown formatting
  processedText = processedText.replace(/\*\*(.*?)\*\*/g, "$1");
  processedText = processedText.replace(/\*(.*?)\*/g, "$1");
  processedText = processedText.replace(/`(.*?)`/g, "$1");
  processedText = processedText.replace(/[ \t]+/g, " ");

  return processedText;
}

// Function to handle muting and save current position
function muteAndSavePosition() {
  if (isAudioPlaying && currentUtterance) {
    if (currentPosition > 0 && lastPlayedText) {
      pausedText = lastPlayedText.substring(currentPosition);
      wasMuted = true;
      console.log("🎙️ MUTE: Speech muted at position:", currentPosition);
    }

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

// Expose functions to the global scope
window.voiceAssistant = {
  speakResponse: speakResponse,
  playLastAudio: playLastAudio,
  speakLastAssistantMessage: speakLastAssistantMessage,
  muteAndSavePosition: muteAndSavePosition,
  resumeFromMute: resumeFromMute,
};
