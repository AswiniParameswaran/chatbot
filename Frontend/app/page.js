"use client";
import { useEffect, useRef, useState } from "react";
import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
const MIME_TYPE_FALLBACKS = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
const MENU_ITEMS = [
  "zinger burger",
  "classic burger",
  "classic chicken burger",
  "popcorn chicken",
  "hot wings",
  "large fries",
  "regular fries",
  "pepsi",
  "7up",
  "7 up",
  "milkshake",
];

export default function Home() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Welcome to KFC! What can I get for you today?" },
  ]);
  const [inputText, setInputText] = useState("");
  const [orderItems, setOrderItems] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  const messagesEndRef = useRef(null);
  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getPrice = (item) => {
    const prices = {
      "zinger burger": 4.99,
      "classic burger": 3.99,
      "popcorn chicken": 5.49,
      "hot wings": 5.99,
      "large fries": 2.49,
      "regular fries": 1.99,
      pepsi: 1.99,
      "7up": 1.99,
      milkshake: 3.49,
    };

    return prices[item] || 0;
  };

  const playAudio = (audioData) => {
    if (!audioData) return;

    setIsSpeaking(true);
    const blob = new Blob([audioData], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);

    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play();

      audioRef.current.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
      };
    }
  };

  const normalizeItemName = (item = "") => {
    const normalized = item.toLowerCase().trim();
    const aliases = {
      "classic chicken burger": "classic burger",
      "large popcorn chicken": "popcorn chicken",
      "small popcorn chicken": "popcorn chicken",
      "6pc hot wings": "hot wings",
      "12pc hot wings": "hot wings",
      "7 up": "7up",
    };

    return aliases[normalized] || normalized;
  };

  const appendOrderItems = (items = []) => {
    if (items.length === 0) return;
    setOrderItems((prev) => [...prev, ...items]);
  };

  const extractOrderItemsFromText = (text = "") => {
    const lowerText = text.toLowerCase();
    return MENU_ITEMS
      .filter((item) => lowerText.includes(item))
      .map((item) => ({
        name: normalizeItemName(item),
        quantity: 1,
        price: getPrice(normalizeItemName(item)),
      }));
  };

  const checkForOrderItems = (text) => {
    appendOrderItems(extractOrderItemsFromText(text));
  };

  const buildOrderItemsFromBackend = (items = []) => {
    return items
      .map((item) => {
        const name = normalizeItemName(item?.item);

        return {
          name,
          quantity: Number(item?.quantity) || 1,
          price: getPrice(name),
        };
      })
      .filter((item) => item.name);
  };

  const formatOrderItemsAsText = (items = []) => {
    return items.map((item) => `${item.quantity} ${item.name}`).join(", ");
  };

  const handleSendMessage = async (text, options = {}) => {
    if (!text.trim()) return;

    const { skipOrderCheck = false } = options;
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInputText("");

    try {
      const response = await axios.post(`${API_BASE_URL}/chat`, null, {
        params: { user_text: text },
      });

      const assistantMessage = response.data?.reply || "Got your order!";
      setMessages((prev) => [...prev, { role: "assistant", text: assistantMessage }]);

      const ttsResponse = await axios.post(`${API_BASE_URL}/text-to-speech`, null, {
        params: { text: assistantMessage },
        responseType: "arraybuffer",
      });

      playAudio(ttsResponse.data);

      if (!skipOrderCheck) {
        checkForOrderItems(text);
      }
    } catch (error) {
      console.error("Error:", error);
      const backendReply = error?.response?.data?.reply;

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            backendReply 
        },
      ]);
    }
  };

  const handleVoiceInput = async (audioBlob) => {
    const formData = new FormData();
    formData.append("file", audioBlob, "voice-input.webm");

    try {
      const response = await axios.post(`${API_BASE_URL}/speech-to-text`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const backendItems = buildOrderItemsFromBackend(response.data?.order_data || []);
      const transcriptItems = extractOrderItemsFromText(response.data?.text || "");
      const itemsToAppend = backendItems.length > 0 ? backendItems : transcriptItems;
      const spokenText =
        formatOrderItemsAsText(itemsToAppend) ||
        response.data?.text ||
        response.data?.receipt?.split("\n").join(", ");
      const assistantReply =
        response.data?.reply || "I heard you. What would you like to add next?";

      if (itemsToAppend.length > 0) {
        appendOrderItems(itemsToAppend);
      }

      if (spokenText) {
        setMessages((prev) => [...prev, { role: "user", text: spokenText }]);
      }

      setInputText("");
      setMessages((prev) => [...prev, { role: "assistant", text: assistantReply }]);

      try {
        const ttsResponse = await axios.post(`${API_BASE_URL}/text-to-speech`, null, {
          params: { text: assistantReply },
          responseType: "arraybuffer",
        });

        playAudio(ttsResponse.data);
      } catch (ttsError) {
        console.error("Voice reply TTS error:", ttsError);
      }
    } catch (error) {
      console.error("Speech-to-text error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, I couldn't process your voice input. Please try again.",
        },
      ]);
    }
  };

  const calculateTotal = () => {
    return orderItems
      .reduce((sum, item) => sum + item.price * item.quantity, 0)
      .toFixed(2);
  };

  const toggleListening = async () => {
    if (isListening) {
      mediaRecorderRef.current?.stop();
      setIsListening(false);
      return;
    }

    if (
      typeof window === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      !window.MediaRecorder
    ) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Voice recording is not supported in this browser.",
        },
      ]);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mimeType = MIME_TYPE_FALLBACKS.find(
        (type) =>
          typeof window.MediaRecorder.isTypeSupported !== "function" ||
          window.MediaRecorder.isTypeSupported(type)
      );

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        setIsListening(false);

        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];

        if (audioBlob.size > 0) {
          await handleVoiceInput(audioBlob);
        }
      };

      recorder.onerror = () => {
        setIsListening(false);
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsListening(true);
    } catch (error) {
      console.error("Microphone access error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Please allow microphone access to use voice ordering.",
        },
      ]);
    }
  };

  const clearOrder = () => {
    setOrderItems([]);
    setShowReceipt(false);
  };

  const printReceipt = () => {
    const receiptContent = `
      KFC DRIVE-THRU RECEIPT
      ======================
      Date: ${new Date().toLocaleString()}
      
      ${orderItems
        .map(
          (item) =>
            `${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`
        )
        .join("\n")}
      
      ======================
      TOTAL: $${calculateTotal()}
      Thank you for visiting KFC!
    `;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`<pre>${receiptContent}</pre>`);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div>
      <audio ref={audioRef} />

      <header className="header">
        <div className="header-container">
          <h1 className="header-title">🍗 KFC Drive-Thru</h1>
          <div>
            <span className="status-badge">
              {isSpeaking ? "🔊 Speaking" : "🎤 Ready"}
            </span>
          </div>
        </div>
      </header>

      <div className="main-container">
        <div className="grid">
          <div className="card">
            <h2 className="card-title">💬 Chat with Assistant</h2>

            <div className="messages-area">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`message ${msg.role === "user" ? "message-user" : "message-assistant"}`}
                >
                  <div className="message-bubble">{msg.text}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="input-area">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputText)}
                placeholder="Type your order..."
                className="input-field"
              />
              <button
                onClick={() => handleSendMessage(inputText)}
                className="btn btn-primary"
              >
                Send
              </button>
              <button
                onClick={toggleListening}
                className={`btn-mic ${isListening ? "listening" : ""}`}
                title="Click to speak"
              >
                🎤
              </button>
            </div>
            <p className="hint-text">
              {isListening ? "Recording... click again to stop" : "Click mic to order by voice"}
            </p>
          </div>

          <div className="card">
            <h2 className="card-title">🛒 Your Order</h2>

            <div className="quick-add">
              <h3 className="quick-add-title">Quick Add:</h3>
              <div className="quick-add-buttons">
                <button
                  onClick={() => handleSendMessage("Add Zinger Burger")}
                  className="quick-add-btn"
                >
                  🍔 Zinger
                </button>
                <button
                  onClick={() => handleSendMessage("Add Large Fries")}
                  className="quick-add-btn"
                >
                  🍟 Large Fries
                </button>
                <button
                  onClick={() => handleSendMessage("Add Pepsi")}
                  className="quick-add-btn"
                >
                  🥤 Pepsi
                </button>
              </div>
            </div>

            <div className="order-items">
              {orderItems.length === 0 ? (
                <p className="empty-order">Your order is empty</p>
              ) : (
                orderItems.map((item, index) => (
                  <div key={index} className="order-item">
                    <div>
                      <span className="item-name">{item.name}</span>
                      <span className="item-quantity">x{item.quantity}</span>
                    </div>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>

            {orderItems.length > 0 && (
              <div className="total-section">
                <div className="total-row">
                  <span>Total:</span>
                  <span>${calculateTotal()}</span>
                </div>
              </div>
            )}

            <div className="action-buttons">
              <button
                onClick={() => setShowReceipt(true)}
                disabled={orderItems.length === 0}
                className={`btn-${orderItems.length > 0 ? "success" : "secondary"}`}
                style={{ flex: 1 }}
              >
                🧾 View Receipt
              </button>
              <button
                onClick={clearOrder}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {showReceipt && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 className="modal-title">🧾 Your Receipt</h3>

              <div className="receipt">
                <p className="receipt-header">KFC DRIVE-THRU</p>
                <p className="receipt-date">{new Date().toLocaleString()}</p>

                {orderItems.map((item, index) => (
                  <div key={index} className="receipt-item">
                    <span>{item.name} x{item.quantity}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}

                <div className="receipt-divider" />

                <div className="receipt-total">
                  <span>TOTAL</span>
                  <span>${calculateTotal()}</span>
                </div>

                <p className="receipt-footer">Thank you for visiting KFC!</p>
              </div>

              <div className="modal-buttons">
                <button onClick={printReceipt} className="btn-blue" style={{ flex: 1 }}>
                  🖨️ Print
                </button>
                <button
                  onClick={() => setShowReceipt(false)}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
