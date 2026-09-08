import React, { useState } from 'react';
import { Mail, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { apiSubscribeNewsletter } from '../services/api';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);
    try {
      const res = await apiSubscribeNewsletter(email.trim());
      if (res && res.success) {
        setSuccessMessage(res.message || 'Merci pour votre inscription ! Votre code de bienvenue BIENVENUE10 est activé.');
        setSubscribed(true);
      }
    } catch {
      setSubscribed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="newsletter-section" aria-label="Inscription à la newsletter">
      <div className="container">
        <div className="newsletter-card">
          <div className="newsletter-content">
            <div className="newsletter-icon-wrap">
              <Mail size={24} color="#ea580c" />
            </div>
            <h2 className="newsletter-title">Ne manquez aucune nouveauté</h2>
            <p className="newsletter-text">
              Recevez nos offres, nouveautés et sélections directement par e-mail.
            </p>

            {subscribed ? (
              <div className="newsletter-success">
                <CheckCircle2 size={18} color="#16a34a" />
                <span>{successMessage || "Merci pour votre inscription ! Votre code de bienvenue BIENVENUE10 est activé."}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="newsletter-form">
                <div className="newsletter-input-group">
                  <input
                    type="email"
                    required
                    placeholder="Votre adresse e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="newsletter-input"
                    aria-label="Votre adresse e-mail"
                    disabled={loading}
                  />
                  <button type="submit" className="btn btn-primary newsletter-btn" disabled={loading}>
                    {loading ? <Loader2 size={16} className="spin" /> : "S'inscrire"}
                  </button>
                </div>
                <div className="newsletter-trust">
                  <ShieldCheck size={14} color="#64748b" />
                  <span>Pas de spam. Désinscription possible à tout moment en 1 clic.</span>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
