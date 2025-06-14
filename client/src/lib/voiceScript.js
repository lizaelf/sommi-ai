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

// AGGRESSIVE VOICE CONTROL VARIABLES
let GUARANTEED_MALE_VOICE = null;
let VOICE_LOCK_VERIFIED = false;
let VOICE_CHECK_INTERVAL = null;
let MALE_VOICE_NAMES = [
  "Google UK English Male",
  "Google US English Male",
  "Microsoft David - English (United States)",
  "Microsoft Mark - English (United States)",
  "Alex", // macOS male voice
  "Daniel", // UK male voice
  "Fred", // US male voice
];

// FORCE VOICE LOADING AND LOCK IMMEDIATELY
function FORCE_MALE_VOICE_LOCK() {
  console.log("🔒 FORCING MALE VOICE LOCK");

  // Cancel any existing speech to reset state
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }

  // Force voice list refresh
  let voices = window.speechSynthesis.getVoices();

  // If no voices, force refresh and wait
  if (voices.length === 0) {
    // Trigger voice loading
    const dummyUtterance = new SpeechSynthesisUtterance("");
    window.speechSynthesis.speak(dummyUtterance);
    window.speechSynthesis.cancel();

    // Wait and try again
    setTimeout(() => {
      voices = window.speechSynthesis.getVoices();
      SELECT_GUARANTEED_MALE_VOICE(voices);
    }, 100);
  } else {
    SELECT_GUARANTEED_MALE_VOICE(voices);
  }
}

function SELECT_GUARANTEED_MALE_VOICE(voices) {
  // Skip logging if already initialized
  if (VOICE_LOCK_VERIFIED && GUARANTEED_MALE_VOICE) {
    return;
  }

  let selectedVoice = null;

  // STRATEGY 1: Find exact match from known male voices
  for (const maleName of MALE_VOICE_NAMES) {
    selectedVoice = voices.find((voice) => voice.name === maleName);
    if (selectedVoice) {
      console.log("Voice locked:", maleName);
      break;
    }
  }

  // STRATEGY 2: Find any voice with "male" in name (case insensitive)
  if (!selectedVoice) {
    selectedVoice = voices.find(
      (voice) =>
        voice.name.toLowerCase().includes("male") ||
        voice.name.toLowerCase().includes("david") ||
        voice.name.toLowerCase().includes("mark") ||
        voice.name.toLowerCase().includes("alex") ||
        voice.name.toLowerCase().includes("daniel"),
    );
    if (selectedVoice) {
      console.log("Male voice found:", selectedVoice.name);
    }
  }

  // STRATEGY 3: Exclude known female voices and pick English
  if (!selectedVoice) {
    selectedVoice = voices.find(
      (voice) =>
        voice.lang.startsWith("en") &&
        !voice.name.toLowerCase().includes("female") &&
        !voice.name.toLowerCase().includes("woman") &&
        !voice.name.toLowerCase().includes("samantha") &&
        !voice.name.toLowerCase().includes("susan") &&
        !voice.name.toLowerCase().includes("karen") &&
        !voice.name.toLowerCase().includes("zira") &&
        !voice.name.toLowerCase().includes("hazel"),
    );
    if (selectedVoice) {
      console.log("English voice selected:", selectedVoice.name);
    }
  }

  // STRATEGY 4: Use first available as absolute fallback
  if (!selectedVoice && voices.length > 0) {
    selectedVoice = voices[0];
    console.log("Using fallback voice:", selectedVoice.name);
  }

  if (selectedVoice) {
    GUARANTEED_MALE_VOICE = selectedVoice;
    VOICE_LOCK_VERIFIED = true;

    // Store globally for other components
    window.selectedVoice = selectedVoice;
    window.guaranteedMaleVoice = selectedVoice;

    console.log("Voice system ready:", selectedVoice.name);

    // Test the voice immediately
    TEST_LOCKED_VOICE();
  } else {
    console.error("❌ NO VOICE AVAILABLE - CRITICAL ERROR");
    VOICE_LOCK_VERIFIED = false;
  }
}

// Test the locked voice to ensure it's male
function TEST_LOCKED_VOICE() {
  if (!GUARANTEED_MALE_VOICE) return;

  const testUtterance = new SpeechSynthesisUtterance("test");
  testUtterance.voice = GUARANTEED_MALE_VOICE;
  testUtterance.volume = 0; // Silent test
  testUtterance.rate = 10; // Super fast

  testUtterance.onerror = (event) => {
    if (event.error !== "interrupted") {
      console.warn("Voice test failed:", event.error);
    }
  };

  window.speechSynthesis.speak(testUtterance);
}

// VERIFY VOICE BEFORE EVERY SPEECH
function VERIFY_MALE_VOICE_BEFORE_SPEECH() {
  if (!VOICE_LOCK_VERIFIED || !GUARANTEED_MALE_VOICE) {
    console.log("⚠️ VOICE NOT VERIFIED - FORCING LOCK");
    FORCE_MALE_VOICE_LOCK();
    return false;
  }

  // Double check the voice still exists
  const currentVoices = window.speechSynthesis.getVoices();
  const voiceStillExists = currentVoices.find(
    (v) => v.voiceURI === GUARANTEED_MALE_VOICE.voiceURI,
  );

  if (!voiceStillExists) {
    console.log("⚠️ LOCKED VOICE NO LONGER EXISTS - RE-LOCKING");
    FORCE_MALE_VOICE_LOCK();
    return false;
  }

  console.log("✅ VOICE VERIFIED:", GUARANTEED_MALE_VOICE.name);
  return true;
}

// DOM load event to initialize everything
document.addEventListener("DOMContentLoaded", function () {
  // IMMEDIATELY LOCK MALE VOICE
  FORCE_MALE_VOICE_LOCK();

  // Set up minimal voice verification (reduced frequency)
  VOICE_CHECK_INTERVAL = setInterval(() => {
    if (!VOICE_LOCK_VERIFIED) {
      FORCE_MALE_VOICE_LOCK();
    }
  }, 30000); // Check every 30 seconds instead of 5

  // Get the microphone button and status div
  const micButton = document.getElementById("mic-button");
  statusDiv = document.getElementById("status");

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

// AGGRESSIVE speakResponse function with guaranteed male voice
async function speakResponse(text) {
  try {
    console.log("🎤 SPEAK REQUEST:", text?.substring(0, 50) + "...");

    // STEP 1: VERIFY MALE VOICE IS LOCKED
    if (!VERIFY_MALE_VOICE_BEFORE_SPEECH()) {
      console.log("⏳ WAITING FOR VOICE LOCK...");
      // Wait for voice lock and try again
      setTimeout(() => speakResponse(text), 200);
      return;
    }

    // Check if this is a resume from mute
    if (wasMuted && pausedText) {
      text = pausedText;
      wasMuted = false;
      console.log("🔄 Resuming speech from muted position");
    } else {
      // Validate text input
      if (!text || typeof text !== "string" || text.trim().length === 0) {
        console.warn("⚠️ Empty or invalid text provided");
        return;
      }

      // Process text for speech
      text = processTextForSpeech(text);

      if (!text || text.trim().length === 0) {
        console.warn("⚠️ Text became empty after processing");
        return;
      }

      lastPlayedText = text;
      currentPosition = 0;
      pausedText = "";
    }

    console.log(
      "🎤 SPEAKING WITH GUARANTEED MALE VOICE:",
      GUARANTEED_MALE_VOICE.name,
    );

    // STEP 2: FORCE CANCEL ANY EXISTING SPEECH
    window.speechSynthesis.cancel();

    // STEP 3: CREATE UTTERANCE WITH LOCKED MALE VOICE
    currentUtterance = new SpeechSynthesisUtterance(text);

    // CRITICAL: SET VOICE BEFORE ANY OTHER PROPERTIES
    currentUtterance.voice = GUARANTEED_MALE_VOICE;

    // STEP 4: VERIFY VOICE WAS SET CORRECTLY
    if (
      !currentUtterance.voice ||
      currentUtterance.voice.name !== GUARANTEED_MALE_VOICE.name
    ) {
      console.error("❌ VOICE ASSIGNMENT FAILED!");
      console.error("Expected:", GUARANTEED_MALE_VOICE.name);
      console.error("Got:", currentUtterance.voice?.name || "null");

      // FORCE VOICE ASSIGNMENT AGAIN
      currentUtterance.voice = GUARANTEED_MALE_VOICE;

      // If still fails, re-lock voice and try again
      if (
        !currentUtterance.voice ||
        currentUtterance.voice.name !== GUARANTEED_MALE_VOICE.name
      ) {
        console.error("❌ CRITICAL: VOICE LOCK FAILED - RE-LOCKING");
        FORCE_MALE_VOICE_LOCK();
        setTimeout(() => speakResponse(text), 300);
        return;
      }
    }

    // Set other properties AFTER voice is confirmed
    currentUtterance.lang = "en-US";
    currentUtterance.rate = 1.0;
    currentUtterance.pitch = 1.0;
    currentUtterance.volume = 1.0;

    console.log("✅ FINAL VOICE CHECK:", currentUtterance.voice.name);
    console.log("✅ VOICE URI:", currentUtterance.voice.voiceURI);

    // STEP 5: ADD EVENT LISTENERS WITH VOICE VERIFICATION
    currentUtterance.onstart = () => {
      console.log("🎤 ▶️ SPEECH STARTED");
      console.log("🎤 ✅ CONFIRMED VOICE:", currentUtterance.voice.name);

      isAudioPlaying = true;
      wasMuted = false;
      document.dispatchEvent(new CustomEvent("audioPlaying"));

      const audioEvent = new CustomEvent("audio-status", {
        detail: { status: "playing", voice: currentUtterance.voice.name },
      });
      window.dispatchEvent(audioEvent);
    };

    currentUtterance.onboundary = (event) => {
      if (event.name === "word") {
        currentPosition = event.charIndex;
      }
    };

    currentUtterance.onend = () => {
      console.log("🎤 ⏹️ SPEECH ENDED");
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
      console.error("🎤 ❌ SPEECH ERROR:", event.error);
      isAudioPlaying = false;
      wasMuted = false;

      // If error is related to voice, try to re-lock
      if (event.error === "voice-unavailable" || event.error === "network") {
        console.log("🔄 RE-LOCKING VOICE DUE TO ERROR");
        FORCE_MALE_VOICE_LOCK();
      }

      const audioEvent = new CustomEvent("audio-status", {
        detail: { status: "stopped", reason: "error", error: event.error },
      });
      window.dispatchEvent(audioEvent);
    };

    // STEP 6: SPEAK WITH GUARANTEED MALE VOICE
    console.log("🎤 🗣️ STARTING SPEECH...");
    window.speechSynthesis.speak(currentUtterance);
  } catch (error) {
    console.error("🎤 ❌ CRITICAL SPEECH ERROR:", error);

    // Last resort fallback
    try {
      const fallbackUtterance = new SpeechSynthesisUtterance(text);
      fallbackUtterance.voice = GUARANTEED_MALE_VOICE;
      window.speechSynthesis.speak(fallbackUtterance);
    } catch (fallbackError) {
      console.error("🎤 ❌ FALLBACK ALSO FAILED:", fallbackError);
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
      console.log("🔇 Speech muted at position:", currentPosition);
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

// Handle voice changes (browser might reload voices)
if (window.speechSynthesis) {
  window.speechSynthesis.addEventListener("voiceschanged", () => {
    console.log("🔄 VOICES CHANGED - RE-LOCKING MALE VOICE");
    FORCE_MALE_VOICE_LOCK();
  });
}

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  if (VOICE_CHECK_INTERVAL) {
    clearInterval(VOICE_CHECK_INTERVAL);
  }
});

// Expose functions to the global scope
window.voiceAssistant = {
  speakResponse: speakResponse,
  playLastAudio: playLastAudio,
  speakLastAssistantMessage: speakLastAssistantMessage,
  muteAndSavePosition: muteAndSavePosition,
  resumeFromMute: resumeFromMute,
  // Debug functions
  forceReLockVoice: FORCE_MALE_VOICE_LOCK,
  getCurrentVoice: () => GUARANTEED_MALE_VOICE,
  isVoiceLocked: () => VOICE_LOCK_VERIFIED,
};
