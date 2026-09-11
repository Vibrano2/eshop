import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Gift
} from 'lucide-react';
import { apiLogin, apiRegister } from '../services/api';
import {
  firebaseSignIn,
  firebaseSignUp,
  firebaseSignInWithGoogle,
  firebaseSignInWithApple
} from '../services/firebase';

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

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCity, setRegCity] = useState('');

  // Reset errors when mode changes or modal opens
  useEffect(() => {
    setErrorMessage('');
    setSuccessMessage('');
    if (initialMode) setMode(initialMode);
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

  // Google OAuth Popup SignIn
  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const res = await firebaseSignInWithGoogle();
      if (res && res.success) {
        setSuccessMessage(`Bienvenue, ${res.user?.firstName || 'Client'} !`);
        setTimeout(() => {
          if (onAuthSuccess) onAuthSuccess(res.user);
          onClose();
        }, 600);
      } else {
        setErrorMessage(res?.error || 'Connexion Google interrompue.');
      }
    } catch (err) {
      setErrorMessage('Erreur lors de la connexion Google.');
    } finally {
      setLoading(false);
    }
  };

  // Apple OAuth Popup SignIn
  const handleAppleSignIn = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const res = await firebaseSignInWithApple();
      if (res && res.success) {
        setSuccessMessage(`Bienvenue, ${res.user?.firstName || 'Client'} !`);
        setTimeout(() => {
          if (onAuthSuccess) onAuthSuccess(res.user);
          onClose();
        }, 600);
      } else {
        setErrorMessage(res?.error || 'Connexion Apple interrompue.');
      }
    } catch (err) {
      setErrorMessage('Erreur lors de la connexion Apple.');
    } finally {
      setLoading(false);
    }
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
      // 1. Prioritize Firebase Auth
      const fbRes = await firebaseSignIn({
        email: loginEmail.trim(),
        password: loginPassword
      });

      if (fbRes && fbRes.success) {
        setSuccessMessage(`Bienvenue, ${fbRes.user?.firstName || 'Client'} !`);
        setTimeout(() => {
          if (onAuthSuccess) onAuthSuccess(fbRes.user);
          onClose();
        }, 600);
        return;
      }

      // 2. Fallback to local / demo backend if Firebase fails
      const res = await apiLogin(loginEmail.trim(), loginPassword);
      if (res && res.success) {
        setSuccessMessage(`Bienvenue, ${res.user?.firstName || 'Client'} !`);
        setTimeout(() => {
          if (onAuthSuccess) onAuthSuccess(res.user);
          onClose();
        }, 600);
      } else {
        setErrorMessage(fbRes?.error || res?.error || 'Adresse email ou mot de passe incorrect.');
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
      // 1. Create user in Firebase Auth & Firestore
      const fbRes = await firebaseSignUp({
        email: regEmail.trim(),
        password: regPassword,
        firstName: regFirstName.trim(),
        lastName: regLastName.trim(),
        phone: regPhone.trim()
      });

      if (fbRes && fbRes.success) {
        setSuccessMessage('Compte créé avec succès ! 50 points de bienvenue offerts 🎁');
        try {
          await apiRegister({
            email: regEmail.trim(),
            password: regPassword,
            firstName: regFirstName.trim(),
            lastName: regLastName.trim(),
            city: regCity.trim()
          });
        } catch (e) {
          // background sync
        }
        setTimeout(() => {
          if (onAuthSuccess) onAuthSuccess(fbRes.user);
          onClose();
        }, 800);
        return;
      }

      // 2. Fallback to local registration if Firebase fails
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
        setErrorMessage(fbRes?.error || res?.error || 'Impossible de créer le compte.');
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
              : 'Rejoignez eshopstore.shop et recevez instantanément 50 points fidélité de bienvenue.'}
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

        {/* Google & Apple Authentication */}
        <div className="auth-social-section">
          <div className="auth-social-buttons">
            <button
              type="button"
              className="auth-social-btn auth-google-btn"
              onClick={handleGoogleSignIn}
              disabled={loading}
              title="Continuer avec Google"
            >
              <svg className="google-icon" width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google</span>
            </button>

            <button
              type="button"
              className="auth-social-btn auth-apple-btn"
              onClick={handleAppleSignIn}
              disabled={loading}
              title="Continuer avec Apple"
            >
              <svg className="apple-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.87c.6-1.06 1.01-2.53.9-4.01-1.28.05-2.83.85-3.74 1.91-.53.61-.99 1.6-1.12 2.56 1.4.11 2.85-.79 3.96-2.46z" />
              </svg>
              <span>Apple</span>
            </button>
          </div>

          <div className="auth-divider">
            <span>ou avec votre adresse e-mail</span>
          </div>
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
