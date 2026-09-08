import React, { useState } from 'react';
import { Mail, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
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
                <span>Merci pour votre inscription ! Votre code de bienvenue <strong>BIENVENUE10</strong> est activé.</span>
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
                  />
                  <button type="submit" className="btn btn-primary newsletter-btn">
                    S'inscrire
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
