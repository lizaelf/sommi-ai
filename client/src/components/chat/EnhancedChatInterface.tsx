import React, { useState, useEffect, useRef } from "react";
import { Mic, Send, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/UseToast";
import { useConversation } from "@/hooks/UseConversation";
import { ClientMessage } from "@/lib/types";
import typography from "@/styles/typography";
import VoiceController from "@/components/voice/VoiceController";
import ChatInputArea from "./ChatInputArea";
import SuggestionPills from "@/components/SuggestionPills";

interface EnhancedChatInterfaceProps {
  selectedWine?: any;
  isScannedPage?: boolean;
}

const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({
  selectedWine,
  isScannedPage = false,
}) => {
  const { toast } = useToast();
  const [isTyping, setIsTyping] = useState(false);
  const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);
  const [isUserRegistered, setIsUserRegistered] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [hideSuggestions, setHideSuggestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // State to control showing chat input interface instead of contact form
  const [showChatInput, setShowChatInput] = useState(true);

  // Simplified content formatter for lists and bold text
  const formatContent = (content: string, isUserMessage = false) => {
    if (!content) return null;

    const formatText = (text: string) => {
      const parts = text.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          part
        ),
      );
    };

    const lines = content.split("\n");
    const formattedLines: JSX.Element[] = [];
    let currentList: string[] = [];
    let isInList = false;

    lines.forEach((line, index) => {
      if (line.trim().match(/^[\d]+\.\s/)) {
        if (!isInList) {
          if (currentList.length > 0) {
            formattedLines.push(
              <ul key={`ul-${formattedLines.length}`}>
                {currentList.map((item, i) => (
                  <li key={i}>{formatText(item)}</li>
                ))}
              </ul>,
            );
            currentList = [];
          }
          isInList = true;
        }
        currentList.push(line.replace(/^[\d]+\.\s/, ""));
      } else if (line.trim().match(/^[-•]\s/)) {
        if (isInList) {
          formattedLines.push(
            <ol key={`ol-${formattedLines.length}`}>
              {currentList.map((item, i) => (
                <li key={i}>{formatText(item)}</li>
              ))}
            </ol>,
          );
          currentList = [];
          isInList = false;
        }
        currentList.push(line.replace(/^[-•]\s/, ""));
      } else {
        if (currentList.length > 0) {
          if (isInList) {
            formattedLines.push(
              <ol key={`ol-${formattedLines.length}`}>
                {currentList.map((item, i) => (
                  <li key={i}>{formatText(item)}</li>
                ))}
              </ol>,
            );
          } else {
            formattedLines.push(
              <ul key={`ul-${formattedLines.length}`}>
                {currentList.map((item, i) => (
                  <li key={i}>{formatText(item)}</li>
                ))}
              </ul>,
            );
          }
          currentList = [];
          isInList = false;
        }

        if (line.trim()) {
          formattedLines.push(
            <p key={`p-${formattedLines.length}`}>{formatText(line)}</p>,
          );
        }
      }
    });

    if (currentList.length > 0) {
      if (isInList) {
        formattedLines.push(
          <ol key={`ol-final`}>
            {currentList.map((item, i) => (
              <li key={i}>{formatText(item)}</li>
            ))}
          </ol>,
        );
      } else {
        formattedLines.push(
          <ul key={`ul-final`}>
            {currentList.map((item, i) => (
              <li key={i}>{formatText(item)}</li>
            ))}
          </ul>,
        );
      }
    }

    return <div>{formattedLines}</div>;
  };

  // Chat conversation management
  const {
    messages,
    currentConversationId,
    addMessage,
    refetchMessages,
  } = useConversation();

  // Check user registration
  useEffect(() => {
    const hasSharedContact = localStorage.getItem("hasSharedContact");
    setIsUserRegistered(!!hasSharedContact);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    try {
      setIsTyping(true);
      setInputValue("");

      // Add user message immediately
      const userMessage: ClientMessage = {
        id: Date.now(),
        content: content.trim(),
        role: "user",
        timestamp: new Date(),
      };

      await addMessage(userMessage);

      // Prepare request body
      const requestBody = {
        messages: [
          ...messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          { role: "user", content: content.trim() },
        ],
        conversationId: currentConversationId,
        wine: selectedWine || null,
      };

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      // Make API call
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.content) {
        const assistantMessage: ClientMessage = {
          id: Date.now() + 1,
          content: data.content,
          role: "assistant",
          timestamp: new Date(),
        };

        await addMessage(assistantMessage);
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Request was aborted");
        return;
      }

      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  };

  const handleSuggestionClick = async (content: string) => {
    await handleSendMessage(content);
  };

  const currentWine = selectedWine || {
    id: 1,
    name: "Ridge \"Lytton Springs\" Dry Creek Zinfandel",
  };

  // Check if user is unregistered and not on scanned page
  const shouldShowRegistrationPrompt = !isUserRegistered && !isScannedPage;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100%",
        backgroundColor: "black",
        position: "relative",
      }}
    >
      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: showChatInput ? "16px" : "0",
          paddingBottom: showChatInput ? "80px" : "0",
          overflow: "hidden",
        }}
      >
        {/* Messages Container */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            paddingBottom: "16px",
          }}
        >
          {messages.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                textAlign: "center",
                padding: "20px",
              }}
            >
              <h2
                style={{
                  ...typography.h2,
                  color: "white",
                  marginBottom: "16px",
                }}
              >
                Chat
              </h2>
              <div
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "24px",
                  maxWidth: "400px",
                }}
              >
                <div
                  style={{
                    ...typography.body1R,
                    color: "#999999",
                    marginBottom: "8px",
                  }}
                >
                  Q: What food pairs well with this wine?
                </div>
                <div
                  style={{
                    ...typography.body1R,
                    color: "white",
                    lineHeight: "1.4",
                  }}
                >
                  This Zinfandel pairs beautifully with grilled meats,
                  barbecue, and aged cheeses. The wine's bold fruit flavors
                  complement smoky, savory dishes while its spice notes enhance
                  complex flavors...
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={() => {}}
                style={{
                  ...typography.buttonBase,
                  padding: "8px 16px",
                  fontSize: "14px",
                }}
              >
                See all
              </Button>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    marginBottom: "16px",
                    display: "flex",
                    justifyContent:
                      message.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "80%",
                      padding: "12px 16px",
                      borderRadius: "16px",
                      backgroundColor:
                        message.role === "user"
                          ? "rgba(255, 255, 255, 0.1)"
                          : "rgba(255, 255, 255, 0.05)",
                      color: "white",
                      ...typography.body1R,
                    }}
                  >
                    {formatContent(message.content, message.role === "user")}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div
                  style={{
                    marginBottom: "16px",
                    display: "flex",
                    justifyContent: "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "80%",
                      padding: "12px 16px",
                      borderRadius: "16px",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      color: "white",
                      ...typography.body1R,
                    }}
                  >
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Voice Assistant */}
      <VoiceController />

      {/* Chat Input Area */}
      <ChatInputArea
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSendMessage={handleSendMessage}
        isProcessing={isTyping}
        wineKey={currentWine ? `wine_${currentWine.id}` : "wine_1"}
      />
    </div>
  );
};

export default EnhancedChatInterface;