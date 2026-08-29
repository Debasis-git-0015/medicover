import React, { useState, useEffect, useRef } from 'react';
import { API } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const ChatHub = () => {
  const { user, showToast, navigateToDashboard } = useAuth();
  const [channels, setChannels] = useState([]);
  const [activeChannelId, setActiveChannelId] = useState('chan_eye');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const loadChannels = async () => {
    try {
      const res = await API.getChatChannels();
      const chList = res.data || [];
      setChannels(chList);
      if (chList.length > 0 && !activeChannelId) {
        setActiveChannelId(chList[0].id);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const loadMessages = async (channelId) => {
    try {
      const res = await API.getChatMessages(channelId);
      setMessages(res.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  useEffect(() => {
    loadChannels();
  }, []);

  useEffect(() => {
    if (activeChannelId) {
      loadMessages(activeChannelId);
    }
  }, [activeChannelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeChannel = channels.find(c => c.id === activeChannelId) || {
    name: 'Staff Channel',
    icon: '💬',
    desc: 'Encrypted clinical communication feed'
  };

  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend || inputText).trim();
    if (!text || !user) return;

    try {
      const res = await API.sendChatMessage({
        channelId: activeChannelId,
        senderId: user.id,
        senderName: user.name,
        senderRole: `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} (${user.department?.toUpperCase()})`,
        text
      });

      setMessages(prev => [...prev, res.data]);
      setInputText('');

      // Auto simulation reply
      simulateReply(res.data);
    } catch (err) {
      showToast('Failed to send message: ' + err.message, 'error');
    }
  };

  const simulateReply = (userMsg) => {
    setTimeout(async () => {
      let reply = null;
      if (activeChannelId === 'chan_eye') {
        if (user.role === 'doctor') {
          reply = {
            senderId: 'nurse_eye1',
            senderName: 'Sister Clara Belle',
            senderRole: 'Nurse (Eye)',
            text: `Understood Dr. ${user.name.replace('Dr. ', '')}. Patient observations updated and vital records logged in the system.`,
            patientRef: userMsg.patientRef
          };
        } else if (user.role === 'nurse') {
          reply = {
            senderId: 'comp_eye1',
            senderName: 'Rajesh Patel',
            senderRole: 'Compounder (Eye)',
            text: 'Prescription received Sister Clara. Preparing dosage and eye drops right now for ward dispatch.',
            patientRef: userMsg.patientRef
          };
        } else if (user.role === 'compounder') {
          reply = {
            senderId: 'doc_eye1',
            senderName: 'Dr. Alistair Vance',
            senderRole: 'Doctor (Eye)',
            text: 'Thank you Rajesh. Please notify Sister Clara once the drops are ready for application.',
            patientRef: userMsg.patientRef
          };
        }
      }

      if (reply) {
        try {
          const res = await API.sendChatMessage({
            channelId: activeChannelId,
            ...reply
          });
          setMessages(prev => [...prev, res.data]);
          showToast(`New message from ${reply.senderName}`, 'info');
        } catch (e) {}
      }
    }, 1200);
  };

  const handleMacroClick = (macro) => {
    setInputText(macro);
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar with prominent Back to Dashboard button */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-nav">
          <div className="sidebar-section-title">Navigation</div>
          {/* EXPLICIT BACK TO DASHBOARD BUTTON */}
          <button
            type="button"
            className="nav-link"
            onClick={navigateToDashboard}
            style={{ fontWeight: 700, color: 'var(--primary-700)', background: 'var(--primary-50)', marginBottom: '0.5rem' }}
          >
            <span className="nav-icon">⬅️</span>
            <span>Back to Dashboard</span>
          </button>

          <button type="button" className="nav-link active">
            <span className="nav-icon">💬</span>
            <span>Inter-Staff Hub</span>
          </button>
        </div>

        <div>
          <div style={{ background: 'var(--bg-app)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', fontSize: '0.78rem' }}>
            <strong style={{ color: 'var(--text-main)' }}>Active Persona</strong>
            <p style={{ color: 'var(--primary-700)', fontSize: '0.72rem', marginTop: '0.2rem' }}>
              {user?.name} ({user?.role?.toUpperCase()})
            </p>
          </div>
        </div>
      </aside>

      {/* Main Chat Hub Area */}
      <section className="dashboard-main">
        <div className="dashboard-header-row">
          <div className="header-title-group">
            <h1>Inter-Staff Real-Time Communication Hub</h1>
            <p>Instant clinical collaboration between Doctors, Ward Nurses, Pharmacy Compounders, and HODs.</p>
          </div>
          {/* Header Return to Dashboard Button */}
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={navigateToDashboard}>
              ⬅️ Return to Dashboard
            </button>
          </div>
        </div>

        <div className="chat-container">
          {/* Channels Sidebar */}
          <div className="chat-sidebar">
            <div className="chat-sidebar-header">
              <h3>💬 Clinical Channels</h3>
            </div>
            <div className="chat-list-wrapper">
              <div className="chat-category-title">Active Channels</div>
              {channels.map(ch => (
                <button
                  key={ch.id}
                  type="button"
                  className={`chat-item ${ch.id === activeChannelId ? 'active' : ''}`}
                  onClick={() => setActiveChannelId(ch.id)}
                >
                  <div className="chat-item-avatar">
                    {ch.icon}
                    <span className="chat-online-indicator"></span>
                  </div>
                  <div className="chat-item-info">
                    <div className="chat-item-name">{ch.name}</div>
                    <div className="chat-item-preview">{ch.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Discussion Window */}
          <div className="chat-main-window">
            <div className="chat-window-header">
              <div className="chat-active-target">
                <div className="chat-item-avatar" style={{ width: '38px', height: '38px', fontSize: '1.1rem' }}>
                  {activeChannel.icon}
                </div>
                <div>
                  <div className="chat-active-name">{activeChannel.name}</div>
                  <div className="chat-active-role">{activeChannel.desc}</div>
                </div>
              </div>
              <span className="badge badge-emerald">● Inter-Staff Encrypted Feed</span>
            </div>

            {/* Messages Area */}
            <div className="chat-messages-area">
              {messages.length === 0 ? (
                <div style={{ margin: 'auto', color: 'var(--text-subtle)', textAlign: 'center' }}>
                  No messages in this channel yet. Start the clinical handoff!
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMe = user && (msg.senderId === user.id || msg.senderName === user.name);
                  return (
                    <div key={msg.id || index} className={`message-group ${isMe ? 'outgoing' : 'incoming'}`}>
                      <div className="message-sender">
                        {!isMe ? <span>{msg.senderName} ({msg.senderRole})</span> : <span>You</span>}
                      </div>
                      <div className="message-bubble">
                        {msg.patientRef && (
                          <div className="message-patient-tag">
                            🏷️ Case: {msg.patientRef}
                          </div>
                        )}
                        <span>{msg.text}</span>
                        <div className="message-time">{msg.timestamp}</div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Medical Macros */}
            <div className="chat-macros-bar">
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-subtle)' }}>⚡ Quick Macros:</span>
              <button type="button" className="macro-chip" onClick={() => handleMacroClick('Urgent: Please dispense medication STAT for patient in Bed.')}>
                🚨 STAT Dispense
              </button>
              <button type="button" className="macro-chip" onClick={() => handleMacroClick('Patient vitals recorded and verified. Stable status.')}>
                📊 Vitals Recorded
              </button>
              <button type="button" className="macro-chip" onClick={() => handleMacroClick('Doctor consult required in Ward Room for IOP check.')}>
                🩺 Consult in Ward
              </button>
              <button type="button" className="macro-chip" onClick={() => handleMacroClick('Prescription is compounded and ready for runner pickup.')}>
                💊 Rx Ready
              </button>
            </div>

            {/* Input Bar */}
            <div className="chat-input-area">
              <input
                type="text"
                placeholder="Type a message or clinical instruction (Press Enter to send)..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <button type="button" className="btn btn-primary" onClick={() => handleSendMessage()}>
                <span>Send</span> ➔
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
