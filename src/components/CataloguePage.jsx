import React, { useState, useMemo, useEffect } from 'react';
import ProductCard from './ProductCard';
import {
  SlidersHorizontal,
  ArrowUpDown,
  X,
  RotateCcw,
  Package,
  Home,
  ChevronRight,
  Filter
} from 'lucide-react';
import { CATEGORIES } from '../data/products';
import { MAIN_CATEGORIES } from '../data/categories';
import { updatePageSEO, injectBreadcrumbJsonLd, resetSEO } from '../services/seo';

export default function CataloguePage({
  products,
  initialCategory = 'all',
  initialSubcategory = null,
  initialSearch = '',
  onOpenDetails,
  onAddToCart,
  wishlist,
  onToggleWishlist,
  onNavigateHome,
  onSelectCategory
}) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSubcategory, setSelectedSubcategory] = useState(initialSubcategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sortBy, setSortBy] = useState('popular');
  const [priceFilter, setPriceFilter] = useState('all'); // all, under20, 20to40, over40
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [hasDiscountOnly, setHasDiscountOnly] = useState(false);
  const [selectedGender, setSelectedGender] = useState('all'); // for mode: all, femme, homme, unisexe
  const [selectedSize, setSelectedSize] = useState('all'); // for fashion
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Sync if initialCategory / initialSubcategory / search changes from outside
  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    setSelectedSubcategory(initialSubcategory);
  }, [initialSubcategory]);

  useEffect(() => {
    setSearchQuery(initialSearch);
  }, [initialSearch]);

  const currentCategoryData = useMemo(() => {
    return MAIN_CATEGORIES.find((c) => c.id === selectedCategory) || null;
  }, [selectedCategory]);

  // Synchronize category SEO & Breadcrumb Schema
  useEffect(() => {
    const catObj = MAIN_CATEGORIES.find((c) => c.id === selectedCategory);
    const catName = catObj ? catObj.name : 'Tous les Produits';
    const subName = selectedSubcategory ? ` • ${selectedSubcategory}` : '';
    const title = `${catName}${subName} — Catalogue E-Commerce UE | eshop-store.eu`;
    const desc = `Explorez notre collection ${catName}. Des gadgets innovants du quotidien sélectionnés avec soin et expédiés rapidement en 2 à 5 jours dans toute l'Union Européenne.`;

    updatePageSEO({
      title,
      description: desc,
      url: `https://eshop-store.eu/?category=${selectedCategory}`,
      type: 'website'
    });

    injectBreadcrumbJsonLd([
      { name: 'Accueil', url: '/' },
      { name: 'Catalogue', url: '/?category=all' },
      ...(catObj ? [{ name: catObj.name, url: `/?category=${catObj.id}` }] : [])
    ]);

    return () => {
      resetSEO();
    };
  }, [selectedCategory, selectedSubcategory]);

  const resetAllFilters = () => {
    setSelectedCategory('all');
    setSelectedSubcategory(null);
    setSelectedGender('all');
    setSelectedSize('all');
    setSearchQuery('');
    setSortBy('popular');
    setPriceFilter('all');
    setMinRating(0);
    setInStockOnly(false);
    setHasDiscountOnly(false);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (selectedSubcategory) count++;
    if (selectedGender !== 'all') count++;
    if (selectedSize !== 'all') count++;
    if (priceFilter !== 'all') count++;
    if (minRating > 0) count++;
    if (inStockOnly) count++;
    if (hasDiscountOnly) count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [selectedCategory, selectedSubcategory, selectedGender, selectedSize, priceFilter, minRating, inStockOnly, hasDiscountOnly, searchQuery]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Category match
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'new') {
          if (!product.isNew) return false;
        } else if (selectedCategory === 'bestsellers') {
          if (!product.isBestSeller) return false;
        } else if (selectedCategory === 'deals') {
          if (!product.compareAtPrice) return false;
        } else if (product.category !== selectedCategory) {
          return false;
        }
      }

      // Subcategory match
      if (selectedSubcategory && product.subcategory !== selectedSubcategory) {
        return false;
      }

      // Gender filter (Fashion)
      if (selectedGender !== 'all') {
        if (product.gender && product.gender !== selectedGender && product.gender !== 'unisexe') {
          return false;
        }
      }

      // Size filter (Fashion)
      if (selectedSize !== 'all') {
        if (!product.sizes || !product.sizes.includes(selectedSize)) {
          return false;
        }
      }

      // Search match across name, categoryLabel, subcategory, shortDescription, keywords
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesDesc = (product.shortDescription || '').toLowerCase().includes(q);
        const matchesCat = (product.categoryLabel || product.category || '').toLowerCase().includes(q);
        const matchesSubcat = (product.subcategory || '').toLowerCase().includes(q);
        const matchesKeywords = product.keywords && product.keywords.some((k) => k.toLowerCase().includes(q));

        if (!matchesName && !matchesDesc && !matchesCat && !matchesSubcat && !matchesKeywords) {
          return false;
        }
      }

      // Price filter
      if (priceFilter === 'under20' && product.price >= 20) return false;
      if (priceFilter === '20to40' && (product.price < 20 || product.price > 40)) return false;
      if (priceFilter === 'over40' && product.price <= 40) return false;

      // Rating
      if (minRating > 0 && product.rating < minRating) return false;

      // Stock
      if (inStockOnly && (!product.stock || product.stock <= 0)) return false;

      // Discount
      if (hasDiscountOnly && !product.compareAtPrice) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'newest') return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      // Popular (default)
      return b.reviewCount - a.reviewCount;
    });
  }, [
    products,
    selectedCategory,
    selectedSubcategory,
    selectedGender,
    selectedSize,
    searchQuery,
    priceFilter,
    minRating,
    inStockOnly,
    hasDiscountOnly,
    sortBy
  ]);

  const renderFiltersContent = () => (
    <div className="catalogue-filters-inner">
      <div className="filter-header-desktop">
        <h3 className="filter-panel-title">Filtres</h3>
        {activeFilterCount > 0 && (
          <button onClick={resetAllFilters} className="filter-reset-link">
            <RotateCcw size={13} />
            <span>Réinitialiser ({activeFilterCount})</span>
          </button>
        )}
      </div>

      {/* Main Categories Navigation Filter */}
      <div className="filter-group">
        <h4 className="filter-group-title">Rayons principaux</h4>
        <div className="filter-category-list">
          <button
            className={`filter-category-item ${selectedCategory === 'all' ? 'selected' : ''}`}
            onClick={() => {
              setSelectedCategory('all');
              setSelectedSubcategory(null);
            }}
          >
            <span>Toutes les catégories</span>
            <span className="filter-category-count">{products.length}</span>
          </button>

          {MAIN_CATEGORIES.map((cat) => {
            const count = products.filter((p) => p.category === cat.id).length;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                className={`filter-category-item ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSelectedSubcategory(null);
                }}
              >
                <span>{cat.name}</span>
                <span className="filter-category-count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Subcategories (Contextual when a main category is selected) */}
      {currentCategoryData && currentCategoryData.subcategories && currentCategoryData.subcategories.length > 0 && (
        <div className="filter-group">
          <h4 className="filter-group-title">Sous-catégories ({currentCategoryData.name})</h4>
          <div className="filter-category-list subcategories-filter-list">
            <button
              className={`filter-category-item ${!selectedSubcategory ? 'selected' : ''}`}
              onClick={() => setSelectedSubcategory(null)}
            >
              <span>Tout afficher</span>
            </button>
            {currentCategoryData.subcategories.map((sub) => {
              const count = products.filter(
                (p) => p.category === selectedCategory && p.subcategory === sub.id
              ).length;
              const isSelected = selectedSubcategory === sub.id;

              return (
                <button
                  key={sub.id}
                  className={`filter-category-item subcat-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedSubcategory(sub.id)}
                >
                  <span>{sub.name}</span>
                  <span className="filter-category-count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Mode Specific: Genre */}
      {selectedCategory === 'mode' && (
        <div className="filter-group">
          <h4 className="filter-group-title">Genre</h4>
          <div className="filter-options-list">
            {[
              { id: 'all', label: 'Tous les genres' },
              { id: 'femme', label: 'Femme' },
              { id: 'homme', label: 'Homme' },
              { id: 'unisexe', label: 'Unisexe' }
            ].map((opt) => (
              <label key={opt.id} className="filter-radio-label">
                <input
                  type="radio"
                  name="genderFilter"
                  checked={selectedGender === opt.id}
                  onChange={() => setSelectedGender(opt.id)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Mode Specific: Taille */}
      {selectedCategory === 'mode' && (
        <div className="filter-group">
          <h4 className="filter-group-title">Taille</h4>
          <div className="filter-sizes-chips">
            {['all', 'XS', 'S', 'M', 'L', 'XL', '40', '41', '42', '43'].map((size) => (
              <button
                key={size}
                type="button"
                className={`size-chip-btn ${selectedSize === size ? 'active' : ''}`}
                onClick={() => setSelectedSize(size)}
              >
                {size === 'all' ? 'Toutes' : size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price Filter */}
      <div className="filter-group">
        <h4 className="filter-group-title">Prix</h4>
        <div className="filter-options-list">
          {[
            { id: 'all', label: 'Tous les prix' },
            { id: 'under20', label: 'Moins de 20 €' },
            { id: '20to40', label: '20 € à 40 €' },
            { id: 'over40', label: 'Plus de 40 €' }
          ].map((opt) => (
            <label key={opt.id} className="filter-radio-label">
              <input
                type="radio"
                name="priceFilter"
                checked={priceFilter === opt.id}
                onChange={() => setPriceFilter(opt.id)}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Rating Filter */}
      <div className="filter-group">
        <h4 className="filter-group-title">Note minimale</h4>
        <div className="filter-options-list">
          {[
            { val: 0, label: 'Toutes les notes' },
            { val: 4.5, label: '★ 4.5 et plus' },
            { val: 4.8, label: '★ 4.8 et plus (Excellence)' }
          ].map((opt) => (
            <label key={opt.val} className="filter-radio-label">
              <input
                type="radio"
                name="ratingFilter"
                checked={minRating === opt.val}
                onChange={() => setMinRating(opt.val)}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Availability & Deals */}
      <div className="filter-group">
        <h4 className="filter-group-title">Disponibilité & Offres</h4>
        <div className="filter-checkbox-list">
          <label className="filter-checkbox-label">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
            />
            <span>En stock immédiat (UE)</span>
          </label>
          <label className="filter-checkbox-label">
            <input
              type="checkbox"
              checked={hasDiscountOnly}
              onChange={(e) => setHasDiscountOnly(e.target.checked)}
            />
            <span>En promotion uniquement</span>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="catalogue-page">
      {/* Breadcrumb Bar */}
      <div className="catalogue-breadcrumb-bar">
        <div className="container">
          <nav className="catalogue-breadcrumb" aria-label="Fil d'Ariane">
            <button onClick={onNavigateHome} className="breadcrumb-link">
              <Home size={14} />
              <span>Accueil</span>
            </button>
            <ChevronRight size={14} className="breadcrumb-separator" />
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedSubcategory(null);
              }}
              className={`breadcrumb-link ${selectedCategory === 'all' ? 'current' : ''}`}
            >
              Catalogue
            </button>

            {currentCategoryData && (
              <>
                <ChevronRight size={14} className="breadcrumb-separator" />
                <span
                  className={`breadcrumb-category ${!selectedSubcategory ? 'current' : ''}`}
                  onClick={() => setSelectedSubcategory(null)}
                  style={{ cursor: selectedSubcategory ? 'pointer' : 'default' }}
                >
                  {currentCategoryData.name}
                </span>
              </>
            )}

            {selectedSubcategory && (
              <>
                <ChevronRight size={14} className="breadcrumb-separator" />
                <span className="breadcrumb-category current">
                  {currentCategoryData?.subcategories?.find((s) => s.id === selectedSubcategory)?.name || selectedSubcategory}
                </span>
              </>
            )}
          </nav>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: '4rem' }}>
        {/* Page Header with Department Title & Description */}
        <div className="catalogue-top-header">
          <div>
            <h1 className="catalogue-page-title">
              {currentCategoryData ? currentCategoryData.name : 'Tous nos produits essentiels'}
            </h1>
            <p className="catalogue-page-desc">
              {currentCategoryData
                ? currentCategoryData.description
                : 'Découvrez notre sélection rigoureusement testée de produits du quotidien expédiés depuis nos entrepôts de l\'UE.'}
            </p>
          </div>

          {/* Controls: Search, Sort, Mobile Filter Trigger */}
          <div className="catalogue-controls-row">
            <div className="catalogue-sort-wrap">
              <ArrowUpDown size={15} color="#64748b" />
              <label htmlFor="catalogue-sort" className="sr-only">
                Trier par
              </label>
              <select
                id="catalogue-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="catalogue-sort-select"
              >
                <option value="popular">Popularité</option>
                <option value="newest">Nouveautés</option>
                <option value="price_asc">Prix : croissant</option>
                <option value="price_desc">Prix : décroissant</option>
                <option value="rating">Mieux notés</option>
              </select>
            </div>

            {/* Mobile Filter Trigger Button */}
            <button
              className="catalogue-mobile-filter-btn"
              onClick={() => setIsMobileFilterOpen(true)}
              aria-label="Ouvrir les filtres"
            >
              <SlidersHorizontal size={16} />
              <span>Filtres</span>
              {activeFilterCount > 0 && (
                <span className="filter-badge-count">{activeFilterCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* Layout: Sidebar + Grid */}
        <div className="catalogue-layout">
          {/* Desktop Sidebar */}
          <aside className="catalogue-sidebar">{renderFiltersContent()}</aside>

          {/* Products Column */}
          <main className="catalogue-main">
            <div className="catalogue-results-header">
              <span className="results-count">
                <strong>{filteredProducts.length}</strong> produit
                {filteredProducts.length > 1 ? 's' : ''} trouvé
                {filteredProducts.length > 1 ? 's' : ''}
              </span>
              {activeFilterCount > 0 && (
                <button onClick={resetAllFilters} className="clear-filters-btn">
                  Effacer tous les filtres
                </button>
              )}
            </div>

            {filteredProducts.length > 0 ? (
              <div className="catalogue-products-grid">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onOpenDetails={onOpenDetails}
                    onAddToCart={onAddToCart}
                    isWishlisted={wishlist.includes(product.id)}
                    onToggleWishlist={onToggleWishlist}
                  />
                ))}
              </div>
            ) : (
              <div className="catalogue-empty-state">
                <Package size={52} className="empty-state-icon" />
                <h3>Aucun produit ne correspond à vos critères</h3>
                <p>Modifiez vos filtres de prix, sous-catégorie ou note pour découvrir d'autres articles.</p>
                <button onClick={resetAllFilters} className="btn btn-primary">
                  Réinitialiser tous les filtres
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {isMobileFilterOpen && (
        <div
          className="mobile-filter-drawer-overlay"
          onClick={() => setIsMobileFilterOpen(false)}
        >
          <div className="mobile-filter-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-filter-header">
              <h3>Filtres de recherche</h3>
              <button
                className="close-drawer-btn"
                onClick={() => setIsMobileFilterOpen(false)}
                aria-label="Fermer les filtres"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mobile-filter-body">{renderFiltersContent()}</div>

            <div className="mobile-filter-footer">
              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => setIsMobileFilterOpen(false)}
              >
                Voir les {filteredProducts.length} résultats
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
