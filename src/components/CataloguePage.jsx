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
  Filter,
  Search,
  Tag,
  Sparkles
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
  onSelectCategory,
  compareList = [],
  onToggleCompare
}) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSubcategory, setSelectedSubcategory] = useState(initialSubcategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sortBy, setSortBy] = useState('popular');
  const [priceFilter, setPriceFilter] = useState('all'); // all, under20, 20to40, over40, custom
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [hasDiscountOnly, setHasDiscountOnly] = useState(false);
  const [selectedGender, setSelectedGender] = useState('all'); // for mode: all, femme, homme, unisexe
  const [selectedSize, setSelectedSize] = useState('all'); // for fashion
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Facet real-time counts across the loaded products catalogue
  const rating45Count = useMemo(() => products.filter((p) => p.rating >= 4.5).length, [products]);
  const rating48Count = useMemo(() => products.filter((p) => p.rating >= 4.8).length, [products]);
  const inStockCount = useMemo(() => products.filter((p) => p.stock && p.stock > 0).length, [products]);
  const discountCount = useMemo(() => products.filter((p) => !!p.compareAtPrice).length, [products]);

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

  // Ensure catalogue page always opens from the very top
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } catch {
      window.scrollTo(0, 0);
    }
  }, [selectedCategory, selectedSubcategory]);

  const currentCategoryData = useMemo(() => {
    return MAIN_CATEGORIES.find((c) => c.id === selectedCategory) || null;
  }, [selectedCategory]);

  // Synchronize category SEO & Breadcrumb Schema
  useEffect(() => {
    const catObj = MAIN_CATEGORIES.find((c) => c.id === selectedCategory);
    const catName = catObj ? catObj.name : 'Tous les Produits';
    const subName = selectedSubcategory ? ` • ${selectedSubcategory}` : '';
    const title = `${catName}${subName} — Catalogue E-Commerce UE | eshopstore.shop`;
    const desc = `Explorez notre collection ${catName}. Des gadgets innovants du quotidien sélectionnés avec soin et expédiés rapidement en 2 à 5 jours dans toute l'Union Européenne.`;

    updatePageSEO({
      title,
      description: desc,
      url: `https://eshopstore.shop/?category=${selectedCategory}`,
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
    setMinPrice('');
    setMaxPrice('');
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
    if (priceFilter !== 'all' && priceFilter !== 'custom') count++;
    if (minPrice !== '' || maxPrice !== '') count++;
    if (minRating > 0) count++;
    if (inStockOnly) count++;
    if (hasDiscountOnly) count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [
    selectedCategory,
    selectedSubcategory,
    selectedGender,
    selectedSize,
    priceFilter,
    minPrice,
    maxPrice,
    minRating,
    inStockOnly,
    hasDiscountOnly,
    searchQuery
  ]);

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
        } else if (selectedCategory === 'tech' || selectedCategory === 'technologie') {
          if (product.category !== 'tech' && product.category !== 'technologie') return false;
        } else if (selectedCategory === 'voyage-auto' || selectedCategory === 'voyage' || selectedCategory === 'auto') {
          if (product.category !== 'voyage-auto' && product.category !== 'voyage' && product.category !== 'auto') return false;
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

      // Custom numeric price range
      if (minPrice !== '' && !isNaN(Number(minPrice)) && product.price < Number(minPrice)) return false;
      if (maxPrice !== '' && !isNaN(Number(maxPrice)) && product.price > Number(maxPrice)) return false;

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
      
      // Default: Prioritize the Curated 20 Products first
      const aCurated = a.isCurated ? 1 : 0;
      const bCurated = b.isCurated ? 1 : 0;
      if (aCurated !== bCurated) {
        return bCurated - aCurated;
      }
      if (a.isCurated && b.isCurated) {
        return (a.curatedOrder || 99) - (b.curatedOrder || 99);
      }
      return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0) || b.reviewCount - a.reviewCount;
    });
  }, [
    products,
    selectedCategory,
    selectedSubcategory,
    selectedGender,
    selectedSize,
    searchQuery,
    priceFilter,
    minPrice,
    maxPrice,
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

      {/* Enhanced Price Filter with Range Inputs & Presets */}
      <div className="filter-group">
        <div className="filter-group-header-row">
          <h4 className="filter-group-title" style={{ marginBottom: 0 }}>Fourchette de Prix</h4>
          {(minPrice !== '' || maxPrice !== '' || priceFilter !== 'all') && (
            <button
              type="button"
              className="filter-clear-sub-btn"
              onClick={() => {
                setMinPrice('');
                setMaxPrice('');
                setPriceFilter('all');
              }}
            >
              Effacer
            </button>
          )}
        </div>

        {/* Dual numeric inputs */}
        <div className="filter-price-inputs-row">
          <div className="price-input-box">
            <span className="price-currency-sign">€</span>
            <input
              type="number"
              min="0"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => {
                setMinPrice(e.target.value);
                setPriceFilter('custom');
              }}
              className="price-num-input"
              aria-label="Prix minimum en euros"
            />
          </div>
          <span className="price-dash">à</span>
          <div className="price-input-box">
            <span className="price-currency-sign">€</span>
            <input
              type="number"
              min="0"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(e.target.value);
                setPriceFilter('custom');
              }}
              className="price-num-input"
              aria-label="Prix maximum en euros"
            />
          </div>
        </div>

        {/* Quick price presets */}
        <div className="filter-price-presets">
          {[
            { id: 'all', label: 'Tous' },
            { id: 'under20', label: '< 20 €' },
            { id: '20to40', label: '20 € - 40 €' },
            { id: 'over40', label: '> 40 €' }
          ].map((preset) => {
            const isActive = priceFilter === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                className={`price-preset-pill ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setPriceFilter(preset.id);
                  if (preset.id === 'all') {
                    setMinPrice('');
                    setMaxPrice('');
                  } else if (preset.id === 'under20') {
                    setMinPrice('');
                    setMaxPrice('20');
                  } else if (preset.id === '20to40') {
                    setMinPrice('20');
                    setMaxPrice('40');
                  } else if (preset.id === 'over40') {
                    setMinPrice('40');
                    setMaxPrice('');
                  }
                }}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rating Filter with Live Facet Counters */}
      <div className="filter-group">
        <h4 className="filter-group-title">Note minimale</h4>
        <div className="filter-options-list">
          {[
            { val: 0, label: 'Toutes les notes', count: products.length },
            { val: 4.5, label: '★ 4.5 et plus', count: rating45Count },
            { val: 4.8, label: '★ 4.8 et plus (Excellence)', count: rating48Count }
          ].map((opt) => (
            <label key={opt.val} className="filter-radio-label">
              <input
                type="radio"
                name="ratingFilter"
                checked={minRating === opt.val}
                onChange={() => setMinRating(opt.val)}
              />
              <span className="filter-label-text">{opt.label}</span>
              <span className="filter-facet-pill">{opt.count}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Availability & Deals with Live Facet Counters */}
      <div className="filter-group">
        <h4 className="filter-group-title">Disponibilité & Offres</h4>
        <div className="filter-checkbox-list">
          <label className="filter-checkbox-label">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
            />
            <span className="filter-label-text">En stock immédiat (UE)</span>
            <span className="filter-facet-pill">{inStockCount}</span>
          </label>
          <label className="filter-checkbox-label">
            <input
              type="checkbox"
              checked={hasDiscountOnly}
              onChange={(e) => setHasDiscountOnly(e.target.checked)}
            />
            <span className="filter-label-text">En promotion uniquement</span>
            <span className="filter-facet-pill">{discountCount}</span>
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

          {/* Controls: Inline Search, Sort, Mobile Filter Trigger */}
          <div className="catalogue-controls-row">
            {/* Inline Catalogue Search */}
            <div className="catalogue-inline-search-wrap">
              <Search size={15} className="catalogue-search-icon" />
              <input
                type="text"
                className="catalogue-inline-search-input"
                placeholder="Filtrer dans ce rayon..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Rechercher dans ce catalogue"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="catalogue-search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  aria-label="Effacer la recherche"
                >
                  ✕
                </button>
              )}
            </div>

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

        {/* Quick Collection Filter Pills */}
        <div className="catalogue-collection-pills-bar" role="tablist" aria-label="Filtrer par collection">
          {[
            { id: 'all', label: 'Tous' },
            { id: 'tech', label: 'Tech' },
            { id: 'maison', label: 'Maison' },
            { id: 'beaute', label: 'Beauté' },
            { id: 'voyage-auto', label: 'Voyage & Auto' }
          ].map((pill) => {
            const isPillActive =
              selectedCategory === pill.id ||
              (pill.id === 'tech' && selectedCategory === 'technologie') ||
              (pill.id === 'voyage-auto' && (selectedCategory === 'voyage' || selectedCategory === 'auto'));

            return (
              <button
                key={pill.id}
                type="button"
                role="tab"
                aria-selected={isPillActive}
                className={`collection-pill-btn ${isPillActive ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCategory(pill.id);
                  setSelectedSubcategory(null);
                  if (onSelectCategory) onSelectCategory(pill.id);
                }}
              >
                {pill.label}
              </button>
            );
          })}
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

            {/* Active Filter Chips Row */}
            {activeFilterCount > 0 && (
              <div className="catalogue-active-chips-bar">
                <span className="active-chips-label">Filtres actifs :</span>
                <div className="active-chips-list">
                  {selectedCategory !== 'all' && (
                    <span className="filter-chip">
                      Rayon : <strong>{currentCategoryData ? currentCategoryData.name : selectedCategory}</strong>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory('all');
                          setSelectedSubcategory(null);
                        }}
                        aria-label="Supprimer le filtre rayon"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {selectedSubcategory && (
                    <span className="filter-chip">
                      Sous-rayon : <strong>{currentCategoryData?.subcategories?.find((s) => s.id === selectedSubcategory)?.name || selectedSubcategory}</strong>
                      <button
                        type="button"
                        onClick={() => setSelectedSubcategory(null)}
                        aria-label="Supprimer la sous-catégorie"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {searchQuery.trim() && (
                    <span className="filter-chip chip-highlight">
                      Recherche : <strong>« {searchQuery} »</strong>
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        aria-label="Effacer le mot-clé de recherche"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {(minPrice !== '' || maxPrice !== '') && (
                    <span className="filter-chip">
                      Prix : <strong>{minPrice ? `${minPrice} €` : '0 €'} - {maxPrice ? `${maxPrice} €` : 'illimité'}</strong>
                      <button
                        type="button"
                        onClick={() => {
                          setMinPrice('');
                          setMaxPrice('');
                          setPriceFilter('all');
                        }}
                        aria-label="Réinitialiser la fourchette de prix"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {priceFilter !== 'all' && priceFilter !== 'custom' && minPrice === '' && maxPrice === '' && (
                    <span className="filter-chip">
                      Prix : <strong>{priceFilter === 'under20' ? '< 20 €' : priceFilter === '20to40' ? '20 € - 40 €' : '> 40 €'}</strong>
                      <button
                        type="button"
                        onClick={() => setPriceFilter('all')}
                        aria-label="Réinitialiser le filtre de prix"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {minRating > 0 && (
                    <span className="filter-chip">
                      Note : <strong>≥ {minRating}★</strong>
                      <button
                        type="button"
                        onClick={() => setMinRating(0)}
                        aria-label="Réinitialiser la note minimale"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {inStockOnly && (
                    <span className="filter-chip">
                      <strong>En stock UE</strong>
                      <button
                        type="button"
                        onClick={() => setInStockOnly(false)}
                        aria-label="Désactiver filtre stock"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {hasDiscountOnly && (
                    <span className="filter-chip">
                      <strong>En promotion</strong>
                      <button
                        type="button"
                        onClick={() => setHasDiscountOnly(false)}
                        aria-label="Désactiver filtre promotion"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {selectedGender !== 'all' && (
                    <span className="filter-chip">
                      Genre : <strong>{selectedGender}</strong>
                      <button
                        type="button"
                        onClick={() => setSelectedGender('all')}
                        aria-label="Réinitialiser le genre"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {selectedSize !== 'all' && (
                    <span className="filter-chip">
                      Taille : <strong>{selectedSize}</strong>
                      <button
                        type="button"
                        onClick={() => setSelectedSize('all')}
                        aria-label="Réinitialiser la taille"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="clear-all-chips-btn"
                  >
                    Effacer tout
                  </button>
                </div>
              </div>
            )}

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
                    isCompared={compareList.includes(product.id)}
                    onToggleCompare={onToggleCompare}
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
