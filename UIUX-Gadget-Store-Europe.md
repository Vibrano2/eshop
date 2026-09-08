# UI/UX — eshop-store.eu

**Version :** 1.0
**Plateforme :** Web responsive, priorité mobile (achat majoritairement via smartphone)
**Marché :** Union Européenne (FR en v1)

---

## 1. Principes de design

- **Mobile-first** : 70-80 % du trafic dropshipping vient du mobile (pub Meta/TikTok) — chaque écran est conçu pour mobile puis adapté au desktop
- **Preuve sociale visible partout** : avis, notes, nombre de ventes affichés sur chaque fiche produit
- **Chemin d'achat court** : accueil → fiche produit → panier → paiement en 3 clics maximum
- **Confiance immédiate** : badges de paiement sécurisé, livraison, retours visibles dès le premier écran
- **Vitesse perçue** : image produit visible en moins de 2 secondes, pas d'animation lourde qui ralentit le chargement

---

## 2. Structure du site (sitemap)

- Accueil
- Boutique (catalogue complet des 39 produits)
- Fiche produit
- Panier
- Tunnel de paiement (3 étapes : livraison → paiement → confirmation)
- Suivi de commande
- Page « À propos »
- FAQ
- Contact
- CGV / Politique de confidentialité / Droit de rétractation (pages légales UE)

---

## 3. Page d'accueil

### Structure (de haut en bas)
1. **Barre d'annonce** (bandeau fin en haut) : ex. « Livraison offerte dès 40 € » ou « Livraison 3-5 jours depuis l'UE »
2. **Header** : logo, recherche, icône panier, menu (Boutique / À propos / Contact)
3. **Hero banner** : visuel fort (photo ou courte vidéo produit en boucle) + accroche + bouton « Découvrir la boutique »
4. **Bandeau de réassurance** : 3-4 icônes (Livraison rapide UE / Paiement sécurisé / Retours 14 jours / Support client réactif)
5. **Produits les plus vendus** (grille de 4 à 8 produits, carrousel sur mobile)
6. **Bloc « Nouveautés »**
7. **Bloc témoignages clients** (avis avec photo si possible)
8. **Newsletter / capture email** (offre -10 % première commande)
9. **Footer** : liens légaux, réseaux sociaux, moyens de paiement acceptés

### Priorité mobile
- Hero en plein écran, texte lisible sans zoom
- Boutons d'action (CTA) larges, pouce-friendly, en bas d'écran si possible
- Grille produits en scroll horizontal pour les sections « best-sellers » et « nouveautés »

---

## 4. Page Boutique (catalogue)

- Vue grille (2 colonnes mobile, 4 colonnes desktop)
- Chaque carte produit : photo, nom court, prix, note (étoiles), badge éventuel (« Best-seller », « -20 % »)
- **Filtres** : par usage (Animaux, Cuisine, Voyage, Voiture, Bureau, Beauté, Sport), par prix, par note
- **Tri** : popularité, prix croissant/décroissant, nouveautés
- Barre de recherche visible en haut de la grille
- Chargement progressif (scroll infini ou pagination simple) pour ne pas surcharger le mobile

---

## 5. Fiche produit

### Éléments obligatoires
1. Galerie photo (3-5 images) + vidéo/GIF de démonstration en premier visuel si disponible
2. Nom du produit + note moyenne + nombre d'avis (cliquable, ancre vers section avis)
3. Prix (et prix barré si promotion)
4. Sélecteur de variante (couleur/taille) si applicable
5. Bouton « Ajouter au panier » fixe en bas d'écran sur mobile (sticky)
6. Bouton secondaire « Acheter maintenant » (paiement direct, sans passer par le panier)
7. Bloc réassurance courte (livraison estimée, retour 14 jours, paiement sécurisé)
8. Description produit : bénéfices en bullet points (pas de pavé de texte), puis description longue
9. FAQ produit (accordéon : 3-5 questions fréquentes)
10. Avis clients avec photos si possible
11. Bloc « Produits complémentaires » / bundle suggéré (cross-sell)
12. Bloc « Vous pourriez aussi aimer » (produits similaires)

---

## 6. Panier

- Accessible en slide-in (tiroir latéral) plutôt que page dédiée, pour rester dans le flux d'achat
- Récapitulatif produit (image, nom, variante, quantité modifiable, prix)
- Champ code promo
- Estimation des frais de livraison affichée avant paiement
- Bouton « Passer commande » toujours visible (sticky)
- Suggestion d'un produit complémentaire à faible prix juste avant le paiement (upsell panier)

---

## 7. Tunnel de paiement

**Étape 1 — Livraison** : email, adresse, pays (liste UE en priorité)
**Étape 2 — Paiement** : carte bancaire, PayPal, Apple Pay / Google Pay affichés en boutons visuels reconnaissables
**Étape 3 — Confirmation** : récapitulatif + numéro de commande + email de confirmation automatique

- Indicateur de progression visible (1/3, 2/3, 3/3)
- Aucun compte obligatoire pour commander (option « commander en invité »)
- Réassurance visible à chaque étape (cadenas sécurité, logos moyens de paiement)

---

## 8. Suivi de commande

- Page dédiée accessible via lien email ou compte client
- Statuts clairs : Confirmée → Expédiée → En transit → Livrée
- Numéro de suivi cliquable vers le transporteur

---

## 9. Pages légales (obligation UE)

- CGV
- Politique de confidentialité (RGPD)
- Droit de rétractation (formulaire de rétractation téléchargeable, délai 14 jours)
- Politique de retours et remboursements
- Mentions légales (identité de l'entreprise, contact)

Accès depuis le footer sur toutes les pages, langage simple (pas seulement du texte juridique brut).

---

## 10. Système de design (à titre indicatif, à affiner avec la charte de marque)

- **Typographie** : une police sans-serif moderne pour les titres, une police lisible et neutre pour le corps de texte
- **Couleurs** : une couleur dominante de marque + une couleur d'accent réservée aux CTA (boutons d'achat) pour qu'ils ressortent visuellement partout sur le site
- **Boutons** : coins arrondis, contraste fort, taille suffisante pour le tactile (min. 44px de hauteur)
- **Icônes de réassurance** : style simple et cohérent (ligne fine), pas d'images trop chargées

---

## 11. Points d'attention UX spécifiques au dropshipping

- Afficher clairement le **délai de livraison réel** (2-5 jours si UE, 7-12 jours si hors UE) pour éviter les avis négatifs liés à l'attente
- Éviter de survendre visuellement (photos trop retouchées) pour limiter le taux de retour
- Mettre en avant les avis avec photos clients réelles plutôt que génériques
- Prévoir un chat ou une FAQ produit bien visible pour réduire les questions avant achat (moins d'abandon panier)

---

## 12. Prochaines étapes

1. Définir la charte graphique complète (logo, couleurs, typographies définitives)
2. Créer les wireframes basse fidélité pour accueil, fiche produit, panier
3. Construire les maquettes haute fidélité (Figma ou directement dans le thème Shopify choisi)
4. Tester le tunnel d'achat complet sur mobile avant lancement
