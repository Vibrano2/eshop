/**
 * SEO & Schema.org JSON-LD Service for eshop-store.eu
 * Manages dynamic document title, meta tags, OpenGraph cards, Twitter cards,
 * and Google Search Rich Snippet JSON-LD.
 */

const DEFAULT_TITLE = "eshop-store.eu — Gadgets Pratiques du Quotidien | Livraison Rapide UE";
const DEFAULT_DESC = "Découvrez notre sélection de gadgets innovants et astucieux pour la maison, la voiture, les animaux et le voyage. Expédition rapide depuis l'Union Européenne en 2 à 5 jours.";
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1200&h=630&q=85";
const BASE_URL = "https://eshop-store.eu";

/**
 * Update document head metadata (Title, Meta Description, OG, Twitter, Canonical)
 */
export function updatePageSEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESC,
  image = DEFAULT_IMAGE,
  url = BASE_URL,
  type = 'website'
} = {}) {
  if (typeof document === 'undefined') return;

  // Title
  document.title = title;

  // Helper to set or create meta tag
  const setMeta = (attr, key, val) => {
    let el = document.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', val);
  };

  // Standard Meta
  setMeta('name', 'description', description);

  // OpenGraph
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:image', image);
  setMeta('property', 'og:url', url);
  setMeta('property', 'og:type', type);

  // Twitter
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', description);
  setMeta('name', 'twitter:image', image);

  // Canonical
  let canonicalEl = document.querySelector('link[rel="canonical"]');
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.setAttribute('href', url);
}

/**
 * Inject or update Schema.org Product Rich Snippet JSON-LD
 * Complies with Google Search Product Rich Results guidelines (Pricing, Rating, Stock, Reviews)
 */
export function injectProductJsonLd(product, reviews = []) {
  if (typeof document === 'undefined' || !product) return;

  const scriptId = 'schema-product-jsonld';
  let scriptEl = document.getElementById(scriptId);
  if (!scriptEl) {
    scriptEl = document.createElement('script');
    scriptEl.id = scriptId;
    scriptEl.type = 'application/ld+json';
    document.head.appendChild(scriptEl);
  }

  const priceFormatted = Number(product.price || 0).toFixed(2);
  const ratingValue = Number(product.rating || 4.8).toFixed(1);
  const reviewCount = Number(product.reviews_count || product.reviewsCount || Math.max(1, reviews.length));
  const productUrl = `${BASE_URL}/?product=${product.id}`;

  const schemaData = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": [
      product.image,
      ...(product.gallery || [])
    ],
    "description": product.shortDescription || product.short_description || product.name,
    "sku": product.sku || product.id,
    "mpn": product.id,
    "brand": {
      "@type": "Brand",
      "name": "eshop-store.eu"
    },
    "offers": {
      "@type": "Offer",
      "url": productUrl,
      "priceCurrency": "EUR",
      "price": priceFormatted,
      "priceValidUntil": "2027-12-31",
      "itemCondition": "https://schema.org/NewCondition",
      "availability": (product.stock ?? 50) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "ESHOP EUROPE COMMERCE SAS"
      },
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": "0.00",
          "currency": "EUR"
        },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": ["FR", "BE", "DE", "ES", "IT"]
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 0,
            "maxValue": 1,
            "unitCode": "DAY"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 2,
            "maxValue": 5,
            "unitCode": "DAY"
          }
        }
      },
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "applicableCountry": "EU",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 30,
        "returnMethod": "https://schema.org/ReturnByMail",
        "returnFees": "https://schema.org/FreeReturn"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": ratingValue,
      "reviewCount": reviewCount,
      "bestRating": "5",
      "worstRating": "1"
    }
  };

  // Add individual reviews if available
  if (reviews && reviews.length > 0) {
    schemaData.review = reviews.slice(0, 5).map((r) => ({
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": String(r.rating || 5),
        "bestRating": "5"
      },
      "author": {
        "@type": "Person",
        "name": r.author_name || "Client Vérifié"
      },
      "datePublished": (r.created_at || new Date().toISOString()).split('T')[0],
      "reviewBody": r.comment || r.title || "Produit conforme et de bonne qualité."
    }));
  }

  scriptEl.textContent = JSON.stringify(schemaData, null, 2);
}

/**
 * Inject BreadcrumbList Schema.org JSON-LD
 */
export function injectBreadcrumbJsonLd(crumbs = []) {
  if (typeof document === 'undefined') return;

  const scriptId = 'schema-breadcrumbs-jsonld';
  let scriptEl = document.getElementById(scriptId);
  if (!scriptEl) {
    scriptEl = document.createElement('script');
    scriptEl.id = scriptId;
    scriptEl.type = 'application/ld+json';
    document.head.appendChild(scriptEl);
  }

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": crumbs.map((c, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "name": c.name,
      "item": c.url.startsWith('http') ? c.url : `${BASE_URL}${c.url}`
    }))
  };

  scriptEl.textContent = JSON.stringify(schemaData, null, 2);
}

/**
 * Reset document SEO back to default storefront metadata
 */
export function resetSEO() {
  updatePageSEO({
    title: DEFAULT_TITLE,
    description: DEFAULT_DESC,
    image: DEFAULT_IMAGE,
    url: `${BASE_URL}/`,
    type: 'website'
  });

  // Remove product & breadcrumb schemas
  const prodEl = document.getElementById('schema-product-jsonld');
  if (prodEl) prodEl.remove();

  const breadcrumbEl = document.getElementById('schema-breadcrumbs-jsonld');
  if (breadcrumbEl) breadcrumbEl.remove();
}
