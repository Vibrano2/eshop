// Firebase SDK integration for eshop-store.eu
// Authentification (Email + Google Sign-In), Cloud Firestore et Cloud Storage

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuration officielle du projet Firebase eshop-16b88
export const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || "AIzaSyB6IMo_s5_YrjK4eqenVcYzqumZ9iN0Rco",
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || "eshop-16b88.firebaseapp.com",
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || "eshop-16b88",
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || "eshop-16b88.firebasestorage.app",
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "952885151547",
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || "1:952885151547:web:bbb79c7b93ae5ab058191e"
};

// Initialisation Singleton de l'application Firebase
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Fournisseur Google Auth
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Fournisseur Apple Auth
export const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

/**
 * Traduction conviviale en français des erreurs Firebase Auth
 */
export function formatFirebaseError(err) {
  const code = err?.code || '';
  switch (code) {
    case 'auth/user-not-found':
      return 'Aucun compte trouvé avec cette adresse email.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Adresse email ou mot de passe incorrect.';
    case 'auth/email-already-in-use':
      return 'Cette adresse email est déjà associée à un compte existant.';
    case 'auth/weak-password':
      return 'Le mot de passe doit comporter au moins 6 caractères.';
    case 'auth/invalid-email':
      return 'Format d\'adresse email invalide.';
    case 'auth/popup-closed-by-user':
      return 'La fenêtre de connexion Google a été fermée avant la finalisation.';
    case 'auth/cancelled-popup-request':
      return 'Demande annulée.';
    case 'auth/network-request-failed':
      return 'Erreur de connexion réseau. Vérifiez votre accès internet.';
    case 'auth/operation-not-allowed':
      return 'Cette méthode de connexion n\'est pas activée dans la console Firebase.';
    default:
      return err?.message || 'Une erreur inattendue est survenue.';
  }
}

/**
 * Formate un profil utilisateur Firebase pour l'adapter à l'état eshop
 */
function formatEshopUser(firebaseUser, extraData = {}) {
  const names = (firebaseUser.displayName || '').split(' ');
  const firstName = extraData.firstName || names[0] || 'Client';
  const lastName = extraData.lastName || names.slice(1).join(' ') || '';

  return {
    id: firebaseUser.uid,
    firebaseUid: firebaseUser.uid,
    email: firebaseUser.email,
    firstName: firstName,
    lastName: lastName,
    phone: extraData.phone || firebaseUser.phoneNumber || '',
    photoURL: firebaseUser.photoURL || null,
    role: extraData.role || 'customer',
    loyaltyCode: extraData.loyaltyCode || `ESHOP-FB${firebaseUser.uid.substring(0, 5).toUpperCase()}`,
    loyaltyPoints: extraData.loyaltyPoints ?? 50,
    address: extraData.address || '',
    city: extraData.city || '',
    postalCode: extraData.postalCode || '',
    countryCode: extraData.countryCode || 'FR'
  };
}

/**
 * Inscription par Email / Mot de passe
 */
export async function firebaseSignUp({ email, password, firstName, lastName, phone }) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();
    await updateProfile(user, { displayName });

    const userProfile = {
      uid: user.uid,
      email: user.email,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone ? phone.trim() : '',
      role: 'customer',
      loyaltyCode: `ESHOP-FB${user.uid.substring(0, 5).toUpperCase()}`,
      loyaltyPoints: 50,
      createdAt: serverTimestamp()
    };

    // Sauvegarder les détails du profil dans Firestore
    try {
      await setDoc(doc(db, 'users', user.uid), userProfile);
    } catch (dbErr) {
      console.warn('[Firestore] Could not write user profile:', dbErr.message);
    }

    return {
      success: true,
      user: formatEshopUser(user, userProfile)
    };
  } catch (err) {
    console.error('[Firebase SignUp Error]:', err);
    return {
      success: false,
      error: formatFirebaseError(err)
    };
  }
}

/**
 * Connexion par Email / Mot de passe
 */
export async function firebaseSignIn({ email, password }) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Récupérer le profil Firestore si existant
    let extraData = {};
    try {
      const docSnap = await getDoc(doc(db, 'users', user.uid));
      if (docSnap.exists()) {
        extraData = docSnap.data();
      }
    } catch (dbErr) {
      console.warn('[Firestore] Could not read user profile:', dbErr.message);
    }

    return {
      success: true,
      user: formatEshopUser(user, extraData)
    };
  } catch (err) {
    console.error('[Firebase SignIn Error]:', err);
    return {
      success: false,
      error: formatFirebaseError(err)
    };
  }
}

/**
 * Connexion sécurisée avec Google (Popup)
 */
export async function firebaseSignInWithGoogle() {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const user = userCredential.user;

    let extraData = {};
    try {
      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        extraData = docSnap.data();
      } else {
        const names = (user.displayName || '').split(' ');
        extraData = {
          uid: user.uid,
          email: user.email,
          firstName: names[0] || 'Client',
          lastName: names.slice(1).join(' ') || '',
          phone: user.phoneNumber || '',
          photoURL: user.photoURL || '',
          role: 'customer',
          loyaltyCode: `ESHOP-FB${user.uid.substring(0, 5).toUpperCase()}`,
          loyaltyPoints: 50,
          createdAt: serverTimestamp()
        };
        await setDoc(userRef, extraData);
      }
    } catch (dbErr) {
      console.warn('[Firestore] Could not sync Google user profile:', dbErr.message);
    }

    return {
      success: true,
      user: formatEshopUser(user, extraData)
    };
  } catch (err) {
    console.error('[Firebase Google SignIn Error]:', err);
    return {
      success: false,
      error: formatFirebaseError(err)
    };
  }
}

/**
 * Connexion sécurisée avec Apple (OAuth Popup via https://eshop-16b88.firebaseapp.com/__/auth/handler)
 */
export async function firebaseSignInWithApple() {
  try {
    const userCredential = await signInWithPopup(auth, appleProvider);
    const user = userCredential.user;

    let extraData = {};
    try {
      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        extraData = docSnap.data();
      } else {
        const names = (user.displayName || '').split(' ');
        extraData = {
          uid: user.uid,
          email: user.email,
          firstName: names[0] || 'Client',
          lastName: names.slice(1).join(' ') || 'Apple',
          phone: user.phoneNumber || '',
          photoURL: user.photoURL || '',
          role: 'customer',
          loyaltyCode: `ESHOP-AP${user.uid.substring(0, 5).toUpperCase()}`,
          loyaltyPoints: 50,
          provider: 'apple.com',
          createdAt: serverTimestamp()
        };
        await setDoc(userRef, extraData);
      }
    } catch (dbErr) {
      console.warn('[Firestore] Could not sync Apple user profile:', dbErr.message);
    }

    return {
      success: true,
      user: formatEshopUser(user, extraData)
    };
  } catch (err) {
    console.error('[Firebase Apple SignIn Error]:', err);
    return {
      success: false,
      error: formatFirebaseError(err)
    };
  }
}

/**
 * Déconnexion Firebase
 */
export async function firebaseSignOutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Abonnement aux changements d'état d'authentification
 */
export function onFirebaseAuthStateChange(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      let extraData = {};
      try {
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        if (docSnap.exists()) {
          extraData = docSnap.data();
        }
      } catch (e) {
        // Mode hors ligne ou permission
      }
      callback(formatEshopUser(user, extraData));
    } else {
      callback(null);
    }
  });
}

/**
 * Synchronisation d'une commande passée dans Firestore
 */
export async function firebaseCreateOrder(orderData) {
  try {
    const docRef = await addDoc(collection(db, 'orders'), {
      ...orderData,
      createdAt: serverTimestamp()
    });
    return { success: true, firestoreId: docRef.id };
  } catch (err) {
    console.warn('[Firestore] Save order failed:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Récupération des commandes d'un utilisateur depuis Firestore
 */
export async function firebaseGetUserOrders(userIdentifier) {
  try {
    const q = query(
      collection(db, 'orders'),
      where('customer_email', '==', userIdentifier),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const querySnapshot = await getDocs(q);
    const orders = [];
    querySnapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, orders };
  } catch (err) {
    console.warn('[Firestore] Fetch orders fallback:', err.message);
    return { success: false, orders: [] };
  }
}

/**
 * Sauvegarde d'un avis client dans Firestore
 */
export async function firebaseSubmitReview(reviewData) {
  try {
    const docRef = await addDoc(collection(db, 'reviews'), {
      ...reviewData,
      createdAt: serverTimestamp()
    });
    return { success: true, reviewId: docRef.id };
  } catch (err) {
    console.warn('[Firestore] Submit review failed:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Récupération des avis produits depuis Firestore
 */
export async function firebaseGetProductReviews(productId) {
  try {
    const q = query(
      collection(db, 'reviews'),
      where('product_id', '==', productId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const snapshot = await getDocs(q);
    const reviews = [];
    snapshot.forEach((doc) => {
      reviews.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, reviews };
  } catch (err) {
    return { success: false, reviews: [] };
  }
}
