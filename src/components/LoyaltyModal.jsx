import React, { useState } from 'react';
import {
  X,
  Gift,
  Share2,
  Copy,
  Check,
  Award,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Mail,
  MessageCircle,
  Tag,
  CheckCircle2
} from 'lucide-react';
import { LOYALTY_REWARDS } from '../data/loyalty';
import { TRANSLATIONS } from '../data/translations';

export default function LoyaltyModal({
  isOpen,
  onClose,
  loyaltyState,
  onClaimReward,
  onApplyPromoCode,
  lang = 'fr'
}) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('referral'); // 'referral' | 'rewards'
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(null);

  const t = TRANSLATIONS[lang]?.loyalty || TRANSLATIONS.fr.loyalty;

  const referralLink = `https://eshopstore.shop?ref=${loyaltyState.referralCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(loyaltyState.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCoupon = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2500);
  };

  // WhatsApp share
  const whatsappShareText = encodeURIComponent(
    `Hello ! Découvre eshopstore.shop, la boutique de gadgets pratiques du quotidien. Profite de 10 € offerts avec mon code parrainage ${loyaltyState.referralCode} : ${referralLink}`
  );
  const whatsappUrl = `https://api.whatsapp.com/send?text=${whatsappShareText}`;

  // Email share
  const emailSubject = encodeURIComponent('10 € offerts sur eshopstore.shop !');
  const emailBody = encodeURIComponent(
    `Bonjour,\n\nJe t'invite à découvrir la boutique eshopstore.shop spécialisée dans les gadgets utiles expédiés depuis l'Europe.\n\nUtilise mon code parrainage ${loyaltyState.referralCode} pour bénéficier de 10 € offerts sur ta première commande :\n${referralLink}\n\nÀ bientôt !`
  );
  const emailUrl = `mailto:?subject=${emailSubject}&body=${emailBody}`;

  // Next tier computation
  const nextReward = LOYALTY_REWARDS.find((r) => r.pointsRequired > loyaltyState.points);
  const pointsToNext = nextReward ? nextReward.pointsRequired - loyaltyState.points : 0;
  const progressPercent = nextReward
    ? Math.min(100, Math.round((loyaltyState.points / nextReward.pointsRequired) * 100))
    : 100;

  return (
    <div className="modal-backdrop-fade" onClick={onClose} role="dialog" aria-modal="true">
      <div className="loyalty-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="loyalty-modal-header">
          <div className="loyalty-header-info">
            <div className="loyalty-pill-badge">
              <Gift size={14} />
              <span>{t.modalTitle}</span>
            </div>
            <h2 className="loyalty-modal-title">{t.modalTitle}</h2>
            <p className="loyalty-modal-subtitle">{t.modalSubtitle}</p>
          </div>

          <div className="loyalty-header-right">
            <div className="loyalty-balance-pill">
              <span className="balance-val">{loyaltyState.points}</span>
              <span className="balance-unit">{t.pointsSuffix}</span>
            </div>
            <button className="loyalty-close-btn" onClick={onClose} aria-label="Fermer">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="loyalty-tabs-nav">
          <button
            className={`loyalty-tab-btn ${activeTab === 'referral' ? 'active' : ''}`}
            onClick={() => setActiveTab('referral')}
          >
            <Share2 size={16} />
            <span>{t.tabReferral}</span>
          </button>
          <button
            className={`loyalty-tab-btn ${activeTab === 'rewards' ? 'active' : ''}`}
            onClick={() => setActiveTab('rewards')}
          >
            <Award size={16} />
            <span>{t.tabRewards}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="loyalty-modal-body">
          {activeTab === 'referral' ? (
            /* TAB 1: PARRAINAGE */
            <div className="referral-tab-content">
              {/* Hero Banner */}
              <div className="referral-hero-banner">
                <div className="hero-gift-circle">
                  <Gift size={32} color="#2563eb" />
                </div>
                <div>
                  <h3 className="referral-hero-title">{t.referralHeroTitle}</h3>
                  <p className="referral-hero-desc">{t.referralHeroSubtitle}</p>
                </div>
              </div>

              {/* Code Box */}
              <div className="referral-codes-grid">
                <div className="referral-box">
                  <label className="referral-box-label">{t.yourCodeLabel}</label>
                  <div className="referral-input-group">
                    <span className="referral-code-highlight">{loyaltyState.referralCode}</span>
                    <button className="copy-action-btn" onClick={handleCopyCode}>
                      {copiedCode ? (
                        <>
                          <Check size={15} color="#059669" />
                          <span className="copied-text">{t.copiedNotice}</span>
                        </>
                      ) : (
                        <>
                          <Copy size={15} />
                          <span>{t.copyCodeBtn}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="referral-box">
                  <label className="referral-box-label">{t.yourLinkLabel}</label>
                  <div className="referral-input-group">
                    <span className="referral-link-preview">{referralLink}</span>
                    <button className="copy-action-btn" onClick={handleCopyLink}>
                      {copiedLink ? (
                        <>
                          <Check size={15} color="#059669" />
                          <span className="copied-text">{t.copiedNotice}</span>
                        </>
                      ) : (
                        <>
                          <Copy size={15} />
                          <span>Copier</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Share Buttons */}
              <div className="referral-share-buttons">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="share-social-btn whatsapp-btn"
                >
                  <MessageCircle size={16} />
                  <span>{t.shareWhatsapp}</span>
                </a>
                <a href={emailUrl} className="share-social-btn email-btn">
                  <Mail size={16} />
                  <span>{t.shareEmail}</span>
                </a>
              </div>

              {/* 3 Steps Explanation */}
              <div className="referral-steps-container">
                <h4 className="referral-steps-heading">{t.howItWorksTitle}</h4>
                <div className="referral-steps-grid">
                  <div className="step-card">
                    <span className="step-badge">1</span>
                    <h5 className="step-title">{t.step1Title}</h5>
                    <p className="step-desc">{t.step1Desc}</p>
                  </div>
                  <div className="step-card">
                    <span className="step-badge">2</span>
                    <h5 className="step-title">{t.step2Title}</h5>
                    <p className="step-desc">{t.step2Desc}</p>
                  </div>
                  <div className="step-card">
                    <span className="step-badge">3</span>
                    <h5 className="step-title">{t.step3Title}</h5>
                    <p className="step-desc">{t.step3Desc}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: RECOMPENSES & POINTS */
            <div className="rewards-tab-content">
              {/* Points Progress Box */}
              <div className="points-status-box">
                <div className="points-status-header">
                  <div>
                    <span className="points-label-small">{t.pointsBalanceLabel}</span>
                    <div className="points-large-display">
                      <span className="points-number">{loyaltyState.points}</span>
                      <span className="points-unit">{t.pointsSuffix}</span>
                    </div>
                  </div>
                  {nextReward && (
                    <div className="points-next-target">
                      <span>Prochain palier :</span>
                      <strong>{nextReward.pointsRequired} pts ({nextReward.discountAmount} €)</strong>
                      <span className="points-remaining">Plus que {pointsToNext} points</span>
                    </div>
                  )}
                </div>

                <div className="points-progress-bar-wrap">
                  <div
                    className="points-progress-fill"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Reward Tiers List */}
              <div className="rewards-catalog-section">
                <h4 className="rewards-section-title">{t.rewardsCatalogLabel}</h4>
                <div className="rewards-cards-grid">
                  {LOYALTY_REWARDS.map((reward) => {
                    const isClaimed = loyaltyState.claimedCoupons?.includes(reward.code);
                    const canAfford = loyaltyState.points >= reward.pointsRequired;
                    const rewardTitle = reward.title[lang] || reward.title.fr;
                    const rewardDesc = reward.description[lang] || reward.description.fr;

                    return (
                      <div
                        key={reward.id}
                        className={`reward-tier-card ${isClaimed ? 'is-claimed' : canAfford ? 'is-available' : 'is-locked'}`}
                      >
                        <div className="reward-tier-header">
                          <div className="reward-tier-icon">
                            <Tag size={18} />
                          </div>
                          <div>
                            <h5 className="reward-tier-title">{rewardTitle}</h5>
                            <p className="reward-tier-desc">{rewardDesc}</p>
                          </div>
                          <span className="reward-points-badge">
                            {reward.pointsRequired} pts
                          </span>
                        </div>

                        <div className="reward-tier-action">
                          {isClaimed ? (
                            <div className="claimed-badge-row">
                              <span className="claimed-code-pill">Code : <strong>{reward.code}</strong></span>
                              <button
                                className="apply-coupon-btn"
                                onClick={() => {
                                  onApplyPromoCode?.(reward.code);
                                  onClose();
                                }}
                              >
                                Appliquer au panier ➔
                              </button>
                            </div>
                          ) : (
                            <button
                              className={`claim-reward-btn ${canAfford ? 'can-claim' : 'disabled'}`}
                              disabled={!canAfford}
                              onClick={() => onClaimReward?.(reward)}
                            >
                              {canAfford ? (
                                <>
                                  <Sparkles size={14} />
                                  <span>{t.claimBtn} {reward.pointsRequired} pts</span>
                                </>
                              ) : (
                                <span>{t.notEnoughPoints} ({reward.pointsRequired} pts)</span>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* History Table */}
              <div className="points-history-section">
                <h4 className="rewards-section-title">{t.pointsHistoryLabel}</h4>
                <div className="points-history-list">
                  {loyaltyState.history.map((item) => (
                    <div key={item.id} className="points-history-row">
                      <div className="history-info">
                        <span className="history-label">{item.label}</span>
                        <span className="history-date">{item.date}</span>
                      </div>
                      <span className={`history-points ${item.type === 'debit' ? 'debit' : 'credit'}`}>
                        {item.type === 'debit' ? '-' : '+'}{item.points} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="loyalty-modal-footer">
          <p className="loyalty-footer-note">
            💡 1 € dépensé = 1 point fidélité. Les points n'expirent jamais et sont valables sur tout le catalogue.
          </p>
        </div>
      </div>
    </div>
  );
}
