import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles, Package, Truck, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
import { TRANSLATIONS } from '../data/translations';

export default function ChatWidget({
  lang = 'fr',
  onOpenTracking,
  onOpenShop,
  onOpenReassurance
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const t = TRANSLATIONS[lang]?.chat || TRANSLATIONS.fr.chat;

  const initialMessages = [
    {
      id: 1,
      sender: 'bot',
      text: t.welcomeMessage,
      time: 'À l’instant'
    }
  ];

  const [messages, setMessages] = useState(initialMessages);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  const handleOpenChat = () => {
    setIsOpen(true);
    setHasUnread(false);
  };

  const handleBotReply = (userQuery) => {
    setIsTyping(true);

    setTimeout(() => {
      const q = userQuery.toLowerCase().trim();
      let reply = '';
      let actionType = null;

      if (q.includes('livraison') || q.includes('delai') || q.includes('délai') || q.includes('frais') || q.includes('shipping') || q.includes('lieferung')) {
        reply = lang === 'de'
          ? "🚚 Unsere Pakete werden innerhalb von 24–48 Stunden aus unseren europäischen Lagern versandt. Die Lieferzeit beträgt 2 bis 5 Werktage. Ab 40 € ist der Versand 100 % kostenlos (sonst 3,90 €)!"
          : lang === 'en'
          ? "🚚 Orders are dispatched within 24-48 hours from our European warehouses. Delivery takes 2 to 5 business days. Free shipping on all orders over €40 (otherwise €3.90)!"
          : "🚚 Nos colis sont expédiés sous 24 à 48h depuis nos centres de distribution européens. La livraison prend 2 à 5 jours ouvrés. Elle est offerte dès 40 € d'achat (3,90 € sinon) !";
      } else if (q.includes('suivi') || q.includes('colis') || q.includes('track') || q.includes('commande') || q.includes('bestellung')) {
        reply = lang === 'de'
          ? "📦 Sie können den Fortschritt Ihres Pakets in Echtzeit über unser Tracking-Tool verfolgen. Haben Sie eine Bestellnummer?"
          : lang === 'en'
          ? "📦 You can track your parcel in real-time with our tracking portal. Do you have your order number ready?"
          : "📦 Vous pouvez suivre l’acheminement de votre colis en temps réel avec notre module de suivi dédié. Cliquez ci-dessous pour ouvrir le suivi :";
        actionType = 'tracking';
      } else if (q.includes('retour') || q.includes('remboursement') || q.includes('retractation') || q.includes('return') || q.includes('rückgabe')) {
        reply = lang === 'de'
          ? "🔄 Gemäß den EU-Vorschriften haben Sie 14 Tage ab Erhalt Zeit, um Ihre Meinung ohne Begründung zu ändern. Rückerstattungen erfolgen innerhalb von 5 bis 7 Tagen."
          : lang === 'en'
          ? "🔄 In compliance with EU law, you have 14 days from delivery to return any item without justification. Refunds are processed within 5 to 7 business days."
          : "🔄 Conformément à la législation européenne, vous disposez de 14 jours dès réception pour changer d'avis sans motif. Le retour est simple et le remboursement s'effectue sous 5 à 7 jours.";
      } else if (q.includes('promo') || q.includes('code') || q.includes('reduction') || q.includes('rabatt') || q.includes('discount')) {
        reply = lang === 'de'
          ? "🎁 Aktuelle Angebote: Nutzen Sie den Code **BIENVENUE10** für 10% Rabatt auf Ihre erste Bestellung oder **PROMO15** ab 50 € Einkaufswert!"
          : lang === 'en'
          ? "🎁 Active vouchers: Use code **BIENVENUE10** for 10% off your first order, or **PROMO15** for 15% off orders over €50!"
          : "🎁 Codes promo actifs : Utilisez le code **BIENVENUE10** pour -10% immédiats dès votre première commande, ou **PROMO15** pour -15% dès 50 € !";
      } else if (q.includes('garantie') || q.includes('ce') || q.includes('panne') || q.includes('warranty')) {
        reply = lang === 'de'
          ? "🛡️ Alle unsere Produkte entsprechen den strengen CE-Normen und beinhalten 2 Jahre gesetzliche EU-Garantie mit reaktionsschnellem Ersatz."
          : lang === 'en'
          ? "🛡️ All our products comply with European CE safety standards and carry a 2-year statutory EU warranty with full replacement or refund support."
          : "🛡️ Tous nos produits sont certifiés conformes aux normes européennes CE et bénéficient de la garantie légale de conformité de 2 ans.";
        actionType = 'reassurance';
      } else if (q.includes('contact') || q.includes('humain') || q.includes('conseiller') || q.includes('email') || q.includes('support')) {
        reply = lang === 'de'
          ? "💬 Unser Kundenteam steht Ihnen gerne zur Verfügung unter contact@eshop-store.eu. Wir antworten werktags innerhalb von 24 Stunden."
          : lang === 'en'
          ? "💬 You can contact our human support team directly at contact@eshop-store.eu. We guarantee a reply within 24 hours."
          : "💬 Notre équipe humaine est à votre disposition par e-mail à contact@eshop-store.eu. Réponse garantie sous 24 heures ouvrées !";
      } else {
        reply = lang === 'de'
          ? "Ich habe Ihre Anfrage notiert. Sie können unseren Katalog mit über 110 praktischen Produkten durchsuchen oder eine Option unten auswählen."
          : lang === 'en'
          ? "I've noted your request. Feel free to browse our 110+ smart everyday gadgets or select a quick topic below."
          : "J'ai bien noté votre question. Vous pouvez explorer notre sélection de 110 gadgets astucieux ou choisir l'un des sujets rapides ci-dessous :";
        actionType = 'shop';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: 'bot',
          text: reply,
          actionType,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsTyping(false);
    }, 450);
  };

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const userText = inputText;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: 'user',
        text: userText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setInputText('');
    handleBotReply(userText);
  };

  const handleQuickTopic = (topicKey, topicLabel) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: 'user',
        text: topicLabel,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    handleBotReply(topicKey);
  };

  return (
    <aside className="chat-widget-wrapper" aria-label="Support client en ligne">
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          className="chat-launcher-btn"
          onClick={handleOpenChat}
          title={t.launcherTooltip}
          aria-expanded="false"
        >
          <div className="chat-launcher-icon-wrap">
            <MessageCircle size={24} color="#ffffff" />
            {hasUnread && <span className="chat-notification-dot" />}
          </div>
          <span className="chat-launcher-label">Aide & Chat</span>
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="chat-window-panel" role="region" aria-label="Fenêtre de chat de support">
          {/* Chat Header */}
          <div className="chat-header">
            <div className="chat-header-profile">
              <div className="chat-avatar-badge">
                <Bot size={20} color="#2563eb" />
                <span className="chat-online-status" />
              </div>
              <div>
                <h4 className="chat-title">{t.headerTitle}</h4>
                <span className="chat-subtitle">{t.status}</span>
              </div>
            </div>
            <button
              className="chat-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Fermer la fenêtre de chat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Body */}
          <div className="chat-messages-container">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-message-row ${msg.sender === 'user' ? 'row-user' : 'row-bot'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="msg-bot-avatar">
                    <Bot size={14} color="#2563eb" />
                  </div>
                )}
                <div className={`chat-bubble ${msg.sender === 'user' ? 'bubble-user' : 'bubble-bot'}`}>
                  <p className="msg-text">{msg.text}</p>
                  <span className="msg-time">{msg.time}</span>

                  {/* Interactive In-Message Actions */}
                  {msg.actionType === 'tracking' && onOpenTracking && (
                    <button
                      className="chat-action-btn"
                      onClick={() => {
                        setIsOpen(false);
                        onOpenTracking();
                      }}
                    >
                      <Package size={14} />
                      <span>Ouvrir le suivi de colis</span>
                    </button>
                  )}
                  {msg.actionType === 'reassurance' && onOpenReassurance && (
                    <button
                      className="chat-action-btn"
                      onClick={() => {
                        setIsOpen(false);
                        onOpenReassurance();
                      }}
                    >
                      <ShieldCheck size={14} />
                      <span>Consulter les garanties UE</span>
                    </button>
                  )}
                  {msg.actionType === 'shop' && onOpenShop && (
                    <button
                      className="chat-action-btn"
                      onClick={() => {
                        setIsOpen(false);
                        onOpenShop('all');
                      }}
                    >
                      <Truck size={14} />
                      <span>Explorer la boutique</span>
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Simulated typing animation */}
            {isTyping && (
              <div className="chat-message-row row-bot">
                <div className="msg-bot-avatar">
                  <Bot size={14} color="#2563eb" />
                </div>
                <div className="chat-bubble bubble-bot typing-bubble">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Topics Carousel */}
          <div className="chat-quick-topics">
            <span className="quick-topics-label">{t.quickTopicsTitle}</span>
            <div className="quick-topics-pills">
              <button
                className="quick-pill"
                onClick={() => handleQuickTopic('livraison', t.topicDelivery)}
              >
                {t.topicDelivery}
              </button>
              <button
                className="quick-pill"
                onClick={() => handleQuickTopic('suivi', t.topicTracking)}
              >
                {t.topicTracking}
              </button>
              <button
                className="quick-pill"
                onClick={() => handleQuickTopic('retours', t.topicReturns)}
              >
                {t.topicReturns}
              </button>
              <button
                className="quick-pill"
                onClick={() => handleQuickTopic('promo', t.topicPromo)}
              >
                {t.topicPromo}
              </button>
              <button
                className="quick-pill"
                onClick={() => handleQuickTopic('garantie', t.topicWarranty)}
              >
                {t.topicWarranty}
              </button>
              <button
                className="quick-pill"
                onClick={() => handleQuickTopic('contact', t.topicHuman)}
              >
                {t.topicHuman}
              </button>
            </div>
          </div>

          {/* Input Form */}
          <form className="chat-input-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              className="chat-input-field"
              placeholder={t.inputPlaceholder}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!inputText.trim()}
              aria-label={t.send}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </aside>
  );
}
