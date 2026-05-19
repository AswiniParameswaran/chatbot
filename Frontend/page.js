"use client";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useSpeechRecognition } from "react-speech-kit";

export default function Home() {

  const [messages, setMessages] = useState([
    { role: "assistant", text: "Welcome to KFC! What can I get for you today?" }
  ]);
  const [inputText, setInputText] = useState("");
  const [orderItems, setOrderItems] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  
  const messagesEndRef = useRef(null);
  const audioRef = useRef(null);

  const { listen, listening, stop } = useSpeechRecognition({
    onResult: (result) => {
      setInputText(result);
      handleSendMessage(result);
    },
  });

  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

 
    setMessages(prev => [...prev, { role: "user", text: text }]);
    setInputText("");

    try {
      const response = await axios.post("http://localhost:8000/chat", null, {
        params: { text: text, session_id: "user123" }
      });

     
      const assistantMessage = response.headers["x-response-text"] || "Got your order!";
      
      
      setMessages(prev => [...prev, { role: "assistant", text: assistantMessage }]);

     
      playAudio(response.data);

     
      checkForOrderItems(text);

    } catch (error) {
      console.error("Error:", error);
      setMessages(prev => [...prev, { role: "assistant", text: "Sorry, connection error. Please try again." }]);
    }
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


  const checkForOrderItems = (text) => {
    const menuItems = [
      "zinger burger", "classic burger", "popcorn chicken", 
      "hot wings", "large fries", "regular fries", "pepsi", "7up", "milkshake"
    ];
    
    const foundItems = [];
    menuItems.forEach(item => {
      if (text.toLowerCase().includes(item)) {
        const words = text.toLowerCase().split(" ");
        let quantity = 1;
        for (let i = 0; i < words.length; i++) {
          if (words[i] === item && i > 0 && !isNaN(words[i-1])) {
            quantity = parseInt(words[i-1]);
          }
        }
        foundItems.push({ name: item, quantity: quantity, price: getPrice(item) });
      }
    });

    if (foundItems.length > 0) {
      setOrderItems(prev => [...prev, ...foundItems]);
    }
  };

  const getPrice = (item) => {
    const prices = {
      "zinger burger": 4.99,
      "classic burger": 3.99,
      "popcorn chicken": 5.49,
      "hot wings": 5.99,
      "large fries": 2.49,
      "regular fries": 1.99,
      "pepsi": 1.99,
      "7up": 1.99,
      "milkshake": 3.49
    };
    return prices[item] || 0;
  };

 
  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
  };

 
  const toggleListening = () => {
    if (listening) {
      stop();
      setIsListening(false);
    } else {
      listen();
      setIsListening(true);
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
      
      ${orderItems.map(item => `${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`).join('\n')}
      
      ======================
      TOTAL: $${calculateTotal()}
      Thank you for visiting KFC!
    `;
    
    const printWindow = window.open('', '_blank');
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
                  <div className="message-bubble">
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="input-area">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage(inputText)}
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
              {isListening ? "Listening... (speak now)" : "Click mic to order by voice"}
            </p>
          </div>

      
          <div className="card">
            <h2 className="card-title">🛒 Your Order</h2>
          
            <div className="quick-add">
              <h3 className="quick-add-title">Quick Add:</h3>
              <div className="quick-add-buttons">
                <button onClick={() => handleSendMessage("Add Zinger Burger")} className="quick-add-btn">
                  🍔 Zinger
                </button>
                <button onClick={() => handleSendMessage("Add Large Fries")} className="quick-add-btn">
                  🍟 Large Fries
                </button>
                <button onClick={() => handleSendMessage("Add Pepsi")} className="quick-add-btn">
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
                
                <div className="receipt-divider"></div>
                
                <div className="receipt-total">
                  <span>TOTAL</span>
                  <span>${calculateTotal()}</span>
                </div>
                
                <p className="receipt-footer">Thank you for visiting KFC!</p>
              </div>

              <div className="modal-buttons">
                <button
                  onClick={printReceipt}
                  className="btn-blue"
                  style={{ flex: 1 }}
                >
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