import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Gift
} from 'lucide-react';
import { apiLogin, apiRegister } from '../services/api';

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = 'login',
  onAuthSuccess,
  onOpenLoyalty
}) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCity, setRegCity] = useState('');

  // Reset messages when switching modes or reopening
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen, initialMode]);

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 1-click test fill for demo account
  const handleFillDemoAccount = () => {
    setMode('login');
    setLoginEmail('demo@eshop-store.eu');
    setLoginPassword('Eshop2026!');
    setErrorMessage('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!loginEmail.trim() || !loginPassword) {
      setErrorMessage('Veuillez renseigner votre e-mail et votre mot de passe.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiLogin(loginEmail.trim(), loginPassword);
      if (res && res.success) {
        setSuccessMessage(`Bienvenue, ${res.user?.firstName || 'Client'} !`);
        setTimeout(() => {
          if (onAuthSuccess) onAuthSuccess(res.user);
          onClose();
        }, 600);
      } else {
        setErrorMessage(res?.error || 'Adresse email ou mot de passe incorrect.');
      }
    } catch (err) {
      setErrorMessage('Erreur réseau. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!regFirstName.trim() || !regLastName.trim()) {
      setErrorMessage('Veuillez renseigner votre prénom et nom.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMessage('Veuillez renseigner une adresse e-mail valide.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMessage('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiRegister({
        email: regEmail.trim(),
        password: regPassword,
        firstName: regFirstName.trim(),
        lastName: regLastName.trim(),
        city: regCity.trim()
      });

      if (res && res.success) {
        setSuccessMessage('Compte créé avec succès ! 50 points de bienvenue offerts 🎁');
        setTimeout(() => {
          if (onAuthSuccess) onAuthSuccess(res.user);
          onClose();
        }, 800);
      } else {
        setErrorMessage(res?.error || 'Impossible de créer le compte.');
      }
    } catch (err) {
      setErrorMessage('Erreur réseau. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div
        className="auth-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        {/* Modal Close Button */}
        <button
          className="auth-close-btn"
          onClick={onClose}
          aria-label="Fermer la fenêtre d'authentification"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="auth-modal-header">
          <div className="auth-brand-badge">
            <User size={22} className="text-primary" />
          </div>
          <h2 id="auth-modal-title" className="auth-title">
            {mode === 'login' ? 'Espace Client & Connexion' : 'Créer votre Compte Privilège'}
          </h2>
          <p className="auth-subtitle">
            {mode === 'login'
              ? 'Accédez à vos commandes, vos points de fidélité et vos avantages exclusifs.'
              : 'Rejoignez eshop-store.eu et recevez instantanément 50 points fidélité de bienvenue.'}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="auth-tabs-nav">
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login');
              setErrorMessage('');
            }}
          >
            Se connecter
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => {
              setMode('register');
              setErrorMessage('');
            }}
          >
            Créer un compte
            <span className="auth-tab-badge">+50 pts</span>
          </button>
        </div>

        {/* Alerts / Feedback */}
        {errorMessage && (
          <div className="auth-alert error">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="auth-alert success">
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="auth-form">
            {/* Demo Quick Button */}
            <div className="auth-demo-banner">
              <div className="auth-demo-text">
                <Sparkles size={15} color="#eab308" />
                <span>Compte de test prêt à l'emploi :</span>
              </div>
              <button
                type="button"
                onClick={handleFillDemoAccount}
                className="auth-demo-btn"
              >
                Remplir avec le compte démo
              </button>
            </div>

            <div className="auth-form-group">
              <label htmlFor="login-email">Adresse e-mail</label>
              <div className="auth-input-wrapper">
                <Mail size={18} className="auth-input-icon" />
                <input
                  id="login-email"
                  type="email"
                  required
                  placeholder="votre.email@exemple.fr"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="auth-form-group">
              <div className="auth-label-row">
                <label htmlFor="login-password">Mot de passe</label>
                <span className="auth-forgot-hint">Démo: Eshop2026!</span>
              </div>
              <div className="auth-input-wrapper">
                <Lock size={18} className="auth-input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spin" />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <>
                  <span>Me connecter</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <div className="auth-switch-footer">
              <span>Vous n'avez pas encore de compte ?</span>
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => {
                  setMode('register');
                  setErrorMessage('');
                }}
              >
                Créer un compte (+50 pts offerts)
              </button>
            </div>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="auth-form">
            <div className="auth-welcome-gift-card">
              <Gift size={20} color="#ec4899" />
              <div>
                <strong>50 points de bienvenue offerts</strong>
                <p>Cumulables dès votre première commande pour débloquer des bons d'achat.</p>
              </div>
            </div>

            <div className="auth-row-2">
              <div className="auth-form-group">
                <label htmlFor="reg-first-name">Prénom</label>
                <div className="auth-input-wrapper">
                  <User size={18} className="auth-input-icon" />
                  <input
                    id="reg-first-name"
                    type="text"
                    required
                    placeholder="Jean"
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <label htmlFor="reg-last-name">Nom</label>
                <div className="auth-input-wrapper">
                  <User size={18} className="auth-input-icon" />
                  <input
                    id="reg-last-name"
                    type="text"
                    required
                    placeholder="Dupont"
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div className="auth-form-group">
              <label htmlFor="reg-email">Adresse e-mail</label>
              <div className="auth-input-wrapper">
                <Mail size={18} className="auth-input-icon" />
                <input
                  id="reg-email"
                  type="email"
                  required
                  placeholder="jean.dupont@exemple.fr"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="auth-row-2">
              <div className="auth-form-group">
                <label htmlFor="reg-password">Mot de passe (min 6 car.)</label>
                <div className="auth-input-wrapper">
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Au moins 6 caractères"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="auth-form-group">
                <label htmlFor="reg-city">Ville (Optionnel)</label>
                <div className="auth-input-wrapper">
                  <input
                    id="reg-city"
                    type="text"
                    placeholder="Paris, Lyon, Bruxelles..."
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spin" />
                  <span>Création du compte...</span>
                </>
              ) : (
                <>
                  <span>Créer mon compte et recevoir mes 50 points</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <div className="auth-switch-footer">
              <span>Vous possédez déjà un compte ?</span>
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => {
                  setMode('login');
                  setErrorMessage('');
                }}
              >
                Se connecter
              </button>
            </div>
          </form>
        )}

        {/* Security Reassurance Footer */}
        <div className="auth-security-note">
          <ShieldCheck size={14} color="#16a34a" />
          <span>Données chiffrées & conformes RGPD UE. Aucun spam, sécurité garantie.</span>
        </div>
      </div>
    </div>
  );
}
