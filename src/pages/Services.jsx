import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MOCK_SERVICES } from '../data/services';
import ServiceCard from '../components/ServiceCard';
import FilterToolbar from '../components/services/FilterToolbar';
import DirectoryEmptyState from '../components/services/DirectoryEmptyState';
import SearchAnalyticsBar from '../components/services/SearchAnalyticsBar';
import ServiceComparisonModal from '../components/services/ServiceComparisonModal';
import ComparisonFloatingTray from '../components/services/ComparisonFloatingTray';
import { comparisonService } from '../services/comparisonService';
import { rankAndFilterServices } from '../services/searchRankingEngine';
import { Sparkles, Layers, Scale } from 'lucide-react';
import RtiBuilderModal from '../components/services/RtiBuilderModal';

const Services = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [comparedServices, setComparedServices] = useState(() => comparisonService.getComparedServices());
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isRtiModalOpen, setIsRtiModalOpen] = useState(false);

  // Read URL params or set defaults
  const activeCategory = searchParams.get('cat') || 'All';
  const searchQuery = searchParams.get('q') || '';
  const selectedMode = searchParams.get('mode') || 'All';
  const selectedDifficulty = searchParams.get('diff') || 'All';
  const selectedDepartment = searchParams.get('dept') || 'All';
  const selectedFee = searchParams.get('fee') || 'All';
  const selectedSpeed = searchParams.get('speed') || 'All';
  const sortBy = searchParams.get('sort') || 'relevance';

  const categories = useMemo(() => {
    return ['All', ...new Set(MOCK_SERVICES.map((s) => s.category))];
  }, []);

  const departments = useMemo(() => {
    return [...new Set(MOCK_SERVICES.map((s) => s.department).filter(Boolean))];
  }, []);

  const updateParam = (key, value, defaultValue = 'All') => {
    const nextParams = new URLSearchParams(searchParams);
    if (!value || value === defaultValue || value === '') {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
    }
    setSearchParams(nextParams, { replace: true });
  };

  const handleCategoryChange = (cat) => updateParam('cat', cat, 'All');
  const handleSearchChange = (query) => updateParam('q', query, '');
  const handleModeChange = (mode) => updateParam('mode', mode, 'All');
  const handleDifficultyChange = (diff) => updateParam('diff', diff, 'All');
  const handleDepartmentChange = (dept) => updateParam('dept', dept, 'All');
  const handleFeeChange = (fee) => updateParam('fee', fee, 'All');
  const handleSpeedChange = (speed) => updateParam('speed', speed, 'All');
  const handleSortChange = (sort) => updateParam('sort', sort, 'relevance');

  const handleResetFilters = () => {
    setSearchParams({}, { replace: true });
  };

  const handleSelectChip = (chip) => {
    const nextParams = new URLSearchParams(searchParams);
    if (chip.query) nextParams.set('q', chip.query);
    if (chip.feeType) nextParams.set('fee', chip.feeType);
    if (chip.speed) nextParams.set('speed', chip.speed);
    setSearchParams(nextParams, { replace: true });
  };

  const hasActiveFilters = Boolean(
    activeCategory !== 'All' ||
    searchQuery ||
    selectedMode !== 'All' ||
    selectedDifficulty !== 'All' ||
    selectedDepartment !== 'All' ||
    selectedFee !== 'All' ||
    selectedSpeed !== 'All' ||
    sortBy !== 'relevance'
  );

  const filteredServices = useMemo(() => {
    return rankAndFilterServices(MOCK_SERVICES, {
      searchQuery,
      category: activeCategory,
      department: selectedDepartment,
      mode: selectedMode,
      difficulty: selectedDifficulty,
      feeType: selectedFee,
      speedFilter: selectedSpeed,
      sortBy,
    });
  }, [
    searchQuery,
    activeCategory,
    selectedDepartment,
    selectedMode,
    selectedDifficulty,
    selectedFee,
    selectedSpeed,
    sortBy,
  ]);

  return (
    <div className="section animate-fade-in" style={{ paddingBottom: '6rem' }}>
      <div className="container">
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--accent-main)',
              fontSize: '0.875rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '0.5rem',
            }}
          >
            <Layers size={18} /> Verified Government Roadmaps
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: '800', marginBottom: '1rem' }}>
            Public Service Directory
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto 1.25rem' }}>
            Official requirements, eligibility criteria, and step-by-step procedures to obtain essential Indian civic services.
          </p>

          <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => setIsRtiModalOpen(true)}
              style={{
                padding: '0.6rem 1.4rem',
                borderRadius: '99px',
                border: '1px solid #2563eb',
                background: '#eff6ff',
                color: '#1d4ed8',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(37,99,235,0.08)'
              }}
            >
              <Scale size={16} />
              <span>Citizen RTI Request Builder (Section 6(1))</span>
            </button>
          </div>
        </div>

        {/* Category Pills Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '1rem',
            marginBottom: '1rem',
            scrollbarWidth: 'none',
          }}
        >
          {categories.map((cat) => {
            const isActive = activeCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryChange(cat)}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '99px',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: isActive ? '1px solid var(--accent-main)' : '1px solid var(--border-light)',
                  background: isActive ? 'var(--accent-main)' : 'var(--glass-bg)',
                  color: isActive ? 'var(--bg-main)' : 'var(--text-secondary)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isActive ? '0 4px 12px rgba(56, 189, 248, 0.25)' : 'none',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search Analytics Bar (Did you mean & Trending chips) */}
        <SearchAnalyticsBar
          searchQuery={searchQuery}
          onSelectSuggestion={(sugg) => handleSearchChange(sugg)}
          onSelectChip={handleSelectChip}
        />

        {/* Multi-Faceted Filter & Search Toolbar */}
        <FilterToolbar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          selectedMode={selectedMode}
          onModeChange={handleModeChange}
          selectedDifficulty={selectedDifficulty}
          onDifficultyChange={handleDifficultyChange}
          departments={departments}
          selectedDepartment={selectedDepartment}
          onDepartmentChange={handleDepartmentChange}
          feeType={selectedFee}
          onFeeTypeChange={handleFeeChange}
          speedFilter={selectedSpeed}
          onSpeedFilterChange={handleSpeedChange}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          totalResults={filteredServices.length}
          onResetFilters={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Services Grid or Empty State */}
        {filteredServices.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.75rem',
            }}
          >
            {filteredServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <DirectoryEmptyState
            searchQuery={searchQuery}
            activeCategory={activeCategory}
            onReset={handleResetFilters}
          />
        )}

        {/* Floating Comparison Tray */}
        <ComparisonFloatingTray
          comparedServices={comparedServices}
          onOpenModal={() => setIsCompareModalOpen(true)}
          onClear={() => {
            comparisonService.clearAll();
            setComparedServices([]);
          }}
          onRemove={(id) => {
            comparisonService.removeService(id);
            setComparedServices(comparisonService.getComparedServices());
          }}
        />

        {/* Service Comparison Matrix Modal */}
        <ServiceComparisonModal
          isOpen={isCompareModalOpen}
          onClose={() => setIsCompareModalOpen(false)}
          comparedServices={comparedServices}
          onUpdateList={(newList) => setComparedServices(newList)}
        />

        {/* Citizen RTI Request Builder Modal */}
        <RtiBuilderModal
          isOpen={isRtiModalOpen}
          onClose={() => setIsRtiModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default Services;
