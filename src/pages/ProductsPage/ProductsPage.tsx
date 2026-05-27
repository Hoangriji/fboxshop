import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProductsQuery } from '../../hooks/useProductsQuery';
import { useCategories } from '../../hooks/useCategories';
import { SimpleProductCard } from '../../components/SimpleProductCard/SimpleProductCard';
import Button from '../../components/Button/Button';
import { Spinner } from '../../components/Spinner';
import './ProductsPage.css';

// DropdownFilter Component
interface DropdownFilterProps {
  label: string;
  icon: string;
  items: string[];
  selectedItems: string[];
  onItemToggle: (item: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  multiColumn?: boolean;
}

const DropdownFilter: React.FC<DropdownFilterProps> = ({
  label,
  icon,
  items,
  selectedItems,
  onItemToggle,
  isOpen,
  onToggle,
  multiColumn = false
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle();
  };

  const handleItemClick = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    onItemToggle(item);
  };

  const selectedCount = selectedItems.length;
  const hasSelection = selectedCount > 0;

  return (
    <div className="dropdown-filter">
      <button
        className={`dropdown-filter-btn ${hasSelection ? 'active' : ''} ${isOpen ? 'open' : ''}`}
        onClick={handleClick}
      >
        <span>
          <i className={icon}></i>{" "}
          {label}
          {hasSelection && <span> ({selectedCount})</span>}
        </span>
        <i className="fas fa-chevron-down"></i>
      </button>
      
      {isOpen && (
        <div className={`dropdown-content ${multiColumn ? 'four-columns' : ''}`}>
          {items.map((item) => {
            const isSelected = selectedItems.includes(item);
            return (
              <div
                key={item}
                className={`dropdown-item ${isSelected ? 'selected' : ''}`}
                onClick={(e) => handleItemClick(e, item)}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}} // Handled by onClick
                />
                <span>{item}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface PriceRange {
  min: number;
  max: number | null;
  label: string;
}

const PRICE_RANGES: PriceRange[] = [
  { min: 0, max: 500000, label: 'Dưới 500K' },
  { min: 500000, max: 1000000, label: '500K - 1TR' },
  { min: 1000000, max: 2000000, label: '1TR - 2TR' },
  { min: 2000000, max: 5000000, label: '2TR - 5TR' },
  { min: 5000000, max: null, label: 'Trên 5TR' },
];

const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const categoryFromUrl = searchParams.get('category') || 'all';
  const [selectedCategory, setSelectedCategory] = React.useState<string>(categoryFromUrl);
  
  const { 
    data: products,
    isLoading: productsLoading,
    isError: productsError,
  } = useProductsQuery();
  
  const { categories, loading: categoriesLoading } = useCategories();

  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((product) => {
      if (!product.category) return;
      counts[product.category] = (counts[product.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  const totalCount = products.length;
  
  const [sortBy, setSortBy] = React.useState<string>('newest');
  const [currentPage, setCurrentPage] = React.useState(1);
  const PRODUCTS_PER_PAGE = 12;
  const [selectedBrands, setSelectedBrands] = React.useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = React.useState<string>('');
  const [selectedSubcategories, setSelectedSubcategories] = React.useState<string[]>([]);
  // New detailed filters
  const [selectedConnectionTypes, setSelectedConnectionTypes] = React.useState<string[]>([]);
  const [selectedCompatibility, setSelectedCompatibility] = React.useState<string[]>([]);
  const [selectedFormFactors, setSelectedFormFactors] = React.useState<string[]>([]);
  const [selectedLedTypes, setSelectedLedTypes] = React.useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = React.useState<string[]>([]);
  // Headset specific filters
  const [selectedHeadsetTypes, setSelectedHeadsetTypes] = React.useState<string[]>([]);
  const [selectedUseCases, setSelectedUseCases] = React.useState<string[]>([]);
  // Monitor specific filters
  const [selectedScreenSizes, setSelectedScreenSizes] = React.useState<string[]>([]);
  const [selectedRefreshRates, setSelectedRefreshRates] = React.useState<string[]>([]);
  const [selectedResolutions, setSelectedResolutions] = React.useState<string[]>([]);
  const [selectedResponseTimes, setSelectedResponseTimes] = React.useState<string[]>([]);
  const [selectedPanelTypes, setSelectedPanelTypes] = React.useState<string[]>([]);
  const [selectedMonitorFeatures, setSelectedMonitorFeatures] = React.useState<string[]>([]);
  // USB filters state
  const [selectedStorageCapacities, setSelectedStorageCapacities] = React.useState<string[]>([]);
  const [selectedUsbTypes, setSelectedUsbTypes] = React.useState<string[]>([]);
  const [selectedReadSpeeds, setSelectedReadSpeeds] = React.useState<string[]>([]);
  const [selectedWriteSpeeds, setSelectedWriteSpeeds] = React.useState<string[]>([]);
  const [selectedMemoryCardTypes, setSelectedMemoryCardTypes] = React.useState<string[]>([]);
  // Digital filters state
  const [selectedContentTypes, setSelectedContentTypes] = React.useState<string[]>([]);
  const [selectedFormatTypes, setSelectedFormatTypes] = React.useState<string[]>([]);
  const [selectedLicenseTypes, setSelectedLicenseTypes] = React.useState<string[]>([]);
  const [selectedSoftwareCompatibility, setSelectedSoftwareCompatibility] = React.useState<string[]>([]);
  // Other products filters
  const [selectedPriceRanges, setSelectedPriceRanges] = React.useState<string[]>([]);
  const [selectedProductTypes, setSelectedProductTypes] = React.useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = React.useState<string[]>([]);

  // Dropdown open states
  const [openDropdowns, setOpenDropdowns] = React.useState<Set<string>>(new Set());
  
  // Sort dropdown state
  const [sortDropdownOpen, setSortDropdownOpen] = React.useState(false);
  
  // Ref for sort dropdown to handle outside clicks
  const sortDropdownRef = React.useRef<HTMLDivElement>(null);

  // Close sort dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setSortDropdownOpen(false);
      }
    };

    if (sortDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sortDropdownOpen]);

  React.useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam && categoryParam !== selectedCategory) {
      setSelectedCategory(categoryParam);
      
      // Reset filters when category changes
      setSelectedBrands([]);
      setSelectedPriceRange('');
      setSelectedSubcategories([]);
      setSelectedConnectionTypes([]);
      setSelectedCompatibility([]);
      setSelectedFormFactors([]);
      setSelectedLedTypes([]);
      setSelectedFeatures([]);
      setSelectedHeadsetTypes([]);
      setSelectedUseCases([]);
      setSelectedScreenSizes([]);
      setSelectedRefreshRates([]);
      setSelectedResolutions([]);
      setSelectedResponseTimes([]);
      setSelectedPanelTypes([]);
      setSelectedMonitorFeatures([]);
      setSelectedStorageCapacities([]);
      setSelectedUsbTypes([]);
      setSelectedReadSpeeds([]);
      setSelectedWriteSpeeds([]);
      setSelectedMemoryCardTypes([]);
      setSelectedContentTypes([]);
      setSelectedFormatTypes([]);
      setSelectedLicenseTypes([]);
      setSelectedSoftwareCompatibility([]);
      setSelectedPriceRanges([]);
      setSelectedProductTypes([]);
      setSelectedMaterials([]);
    }
  }, [searchParams, selectedCategory]);

  // Extract brands from products based on brand field or tags
  const availableBrands = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    
    const categoryProducts = selectedCategory === 'all' 
      ? products 
      : products.filter(product => product.category === selectedCategory);
    
    const brands = new Set<string>();
    categoryProducts.forEach(product => {
      // Check brand field first (new approach)
      if (product.brand) {
        brands.add(product.brand);
      }
      // Fallback to tags for backward compatibility
      const brandTags = ['LOGITECH', 'RAZER', 'CORSAIR', 'STEELSERIES', 'AKKO', 'DAREU', 'KEYCHRON', 'FILCO', 'LEOPOLD', 'APPLE', 'ASUS', 'E-DRA', 'RAPOO'];
      if (product.tags && Array.isArray(product.tags)) {
        product.tags.forEach(tag => {
          const upperTag = tag.toUpperCase();
          if (brandTags.includes(upperTag)) {
            brands.add(upperTag);
          }
        });
      }
    });
    
    return Array.from(brands).sort();
  }, [products, selectedCategory]);

  // Extract connection types
  const availableConnectionTypes = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    
    const categoryProducts = selectedCategory === 'all' 
      ? products 
      : products.filter(product => product.category === selectedCategory);
    
    const connectionTypes = new Set<string>();
    categoryProducts.forEach(product => {
      if (product.connection_types && Array.isArray(product.connection_types)) {
        product.connection_types.forEach(type => connectionTypes.add(type));
      }
    });
    
    return Array.from(connectionTypes).sort();
  }, [products, selectedCategory]);

  // Extract compatibility options
  const availableCompatibility = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    
    const categoryProducts = selectedCategory === 'all' 
      ? products 
      : products.filter(product => product.category === selectedCategory);
    
    const compatibility = new Set<string>();
    categoryProducts.forEach(product => {
      if (product.compatibility && Array.isArray(product.compatibility)) {
        product.compatibility.forEach(comp => compatibility.add(comp));
      }
    });
    
    return Array.from(compatibility).sort();
  }, [products, selectedCategory]);

  // Extract form factors
  const availableFormFactors = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    
    const categoryProducts = selectedCategory === 'all' 
      ? products 
      : products.filter(product => product.category === selectedCategory);
    
    const formFactors = new Set<string>();
    categoryProducts.forEach(product => {
      if (product.form_factor) {
        formFactors.add(product.form_factor);
      }
    });
    
    return Array.from(formFactors).sort();
  }, [products, selectedCategory]);

  // Extract LED types
  const availableLedTypes = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    const categoryProducts = selectedCategory === 'all' 
      ? products 
      : products.filter(product => product.category === selectedCategory);
    
    const ledTypes = new Set<string>();
    categoryProducts.forEach(product => {
      if (product.led_type) {
        ledTypes.add(product.led_type);
      }
    });
    
    return Array.from(ledTypes).sort();
  }, [products, selectedCategory]);

  // Extract features
  const availableFeatures = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    const categoryProducts = selectedCategory === 'all' 
      ? products 
      : products.filter(product => product.category === selectedCategory);
    
    const features = new Set<string>();
    categoryProducts.forEach(product => {
      if (product.features_detailed) {
        product.features_detailed.forEach(feature => features.add(feature));
      }
    });
    
    return Array.from(features).sort();
  }, [products, selectedCategory]);

  // Extract headset types
  const availableHeadsetTypes = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    const categoryProducts = selectedCategory === 'all' 
      ? products 
      : products.filter(product => product.category === selectedCategory);
    
    const headsetTypes = new Set<string>();
    categoryProducts.forEach(product => {
      if (product.headset_type) {
        headsetTypes.add(product.headset_type);
      }
    });
    
    return Array.from(headsetTypes).sort();
  }, [products, selectedCategory]);

  // Extract use cases
  const availableUseCases = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    const categoryProducts = selectedCategory === 'all' 
      ? products 
      : products.filter(product => product.category === selectedCategory);
    
    const useCases = new Set<string>();
    categoryProducts.forEach(product => {
      if (product.use_cases) {
        product.use_cases.forEach(useCase => useCases.add(useCase));
      }
    });
    
    return Array.from(useCases).sort();
  }, [products, selectedCategory]);

  // Extract monitor screen sizes
  const availableScreenSizes = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    const categoryProducts = selectedCategory === 'all' 
      ? products 
      : products.filter(product => product.category === selectedCategory);
    
    const screenSizes = new Set<string>();
    categoryProducts.forEach(product => {
      if (product.screen_size) {
        screenSizes.add(product.screen_size);
      }
    });
    
    return Array.from(screenSizes).sort();
  }, [products, selectedCategory]);

  // Extract monitor refresh rates
  const availableRefreshRates = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    const categoryProducts = selectedCategory === 'all' 
      ? products 
      : products.filter(product => product.category === selectedCategory);
    
    const refreshRates = new Set<string>();
    categoryProducts.forEach(product => {
      if (product.refresh_rate) {
        refreshRates.add(product.refresh_rate);
      }
    });
    
    return Array.from(refreshRates).sort();
  }, [products, selectedCategory]);

  // Extract monitor resolutions
  const availableResolutions = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    const categoryProducts = selectedCategory === 'all' 
      ? products 
      : products.filter(product => product.category === selectedCategory);
    
    const resolutions = new Set<string>();
    categoryProducts.forEach(product => {
      if (product.resolution) {
        resolutions.add(product.resolution);
      }
    });
    
    return Array.from(resolutions).sort();
  }, [products, selectedCategory]);

  // Extract monitor response times
  const availableResponseTimes = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    const categoryProducts = selectedCategory === 'all' 
      ? products 
      : products.filter(product => product.category === selectedCategory);
    
    const responseTimes = new Set<string>();
    categoryProducts.forEach(product => {
      if (product.response_time) {
        responseTimes.add(product.response_time);
      }
    });
    
    return Array.from(responseTimes).sort();
  }, [products, selectedCategory]);

  // Extract monitor panel types
  const availablePanelTypes = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    const categoryProducts = selectedCategory === 'all' 
      ? products 
      : products.filter(product => product.category === selectedCategory);
    
    const panelTypes = new Set<string>();
    categoryProducts.forEach(product => {
      if (product.panel_type) {
        panelTypes.add(product.panel_type);
      }
    });
    
    return Array.from(panelTypes).sort();
  }, [products, selectedCategory]);

  // Extract monitor features
  const availableMonitorFeatures = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    const categoryProducts = selectedCategory === 'all' 
      ? products 
      : products.filter(product => product.category === selectedCategory);
    
    const monitorFeatures = new Set<string>();
    categoryProducts.forEach(product => {
      if (product.monitor_features) {
        product.monitor_features.forEach(feature => monitorFeatures.add(feature));
      }
    });
    
    return Array.from(monitorFeatures).sort();
  }, [products, selectedCategory]);

  // Extract USB storage capacities
  const availableStorageCapacities = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    const categoryProducts = selectedCategory === 'all' 
      ? products 
      : products.filter(product => product.category === selectedCategory);
    
    const capacities = new Set<string>();
    categoryProducts.forEach(product => {
      if (product.storage_capacity) {
        capacities.add(product.storage_capacity);
      }
    });
    
    return Array.from(capacities).sort();
  }, [products, selectedCategory]);

  // Extract USB types
  const availableUsbTypes = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    const categoryProducts = selectedCategory === 'all' 
      ? products 
      : products.filter(product => product.category === selectedCategory);
    
    const usbTypes = new Set<string>();
    categoryProducts.forEach(product => {
      if (product.usb_type) {
        usbTypes.add(product.usb_type);
      }
    });
    
    return Array.from(usbTypes).sort();
  }, [products, selectedCategory]);

  // Extract read speeds
  const availableReadSpeeds = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    const categoryProducts = selectedCategory === 'all' 
      ? products 
      : products.filter(product => product.category === selectedCategory);
    
    const readSpeeds = new Set<string>();
    categoryProducts.forEach(product => {
      if (product.read_speed) {
        readSpeeds.add(product.read_speed);
      }
    });
    
    return Array.from(readSpeeds).sort();
  }, [products, selectedCategory]);

  // Extract write speeds
  const availableWriteSpeeds = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    const categoryProducts = selectedCategory === 'all' 
      ? products 
      : products.filter(product => product.category === selectedCategory);
    
    const writeSpeeds = new Set<string>();
    categoryProducts.forEach(product => {
      if (product.write_speed) {
        writeSpeeds.add(product.write_speed);
      }
    });
    
    return Array.from(writeSpeeds).sort();
  }, [products, selectedCategory]);

  // Extract memory card types
  const availableMemoryCardTypes = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    const categoryProducts = selectedCategory === 'all' 
      ? products 
      : products.filter(product => product.category === selectedCategory);
    
    const cardTypes = new Set<string>();
    categoryProducts.forEach(product => {
      if (product.memory_card_type) {
        cardTypes.add(product.memory_card_type);
      }
    });
    
    return Array.from(cardTypes).sort();
  }, [products, selectedCategory]);

  // Extract digital content types
  const availableContentTypes = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    const categoryProducts = selectedCategory === 'all' 
      ? products 
      : products.filter(product => product.category === selectedCategory);
    
    const contentTypes = new Set<string>();
    categoryProducts.forEach(product => {
      if (product.content_type) {
        contentTypes.add(product.content_type);
      }
    });
    
    return Array.from(contentTypes).sort();
  }, [products, selectedCategory]);

  // Extract digital format types
  const availableFormatTypes = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    const categoryProducts = selectedCategory === 'all' 
      ? products 
      : products.filter(product => product.category === selectedCategory);
    
    const formatTypes = new Set<string>();
    categoryProducts.forEach(product => {
      if (product.format_type) {
        formatTypes.add(product.format_type);
      }
    });
    
    return Array.from(formatTypes).sort();
  }, [products, selectedCategory]);

  // Extract digital license types
  const availableLicenseTypes = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    const categoryProducts = selectedCategory === 'all' 
      ? products 
      : products.filter(product => product.category === selectedCategory);
    
    const licenseTypes = new Set<string>();
    categoryProducts.forEach(product => {
      if (product.license_type) {
        licenseTypes.add(product.license_type);
      }
    });
    
    return Array.from(licenseTypes).sort();
  }, [products, selectedCategory]);

  // Extract digital software compatibility
  const availableSoftwareCompatibility = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    const categoryProducts = selectedCategory === 'all' 
      ? products 
      : products.filter(product => product.category === selectedCategory);
    
    const softwareCompat = new Set<string>();
    categoryProducts.forEach(product => {
      if (product.software_compatibility) {
        product.software_compatibility.forEach(software => softwareCompat.add(software));
      }
    });
    
    return Array.from(softwareCompat).sort();
  }, [products, selectedCategory]);

  // Extract other products price ranges
  const availableOtherPriceRanges = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    const categoryProducts = selectedCategory === 'all' 
      ? products 
      : products.filter(product => product.category === selectedCategory);
    
    const priceRanges = new Set<string>();
    categoryProducts.forEach(product => {
      if (product.price_range) {
        priceRanges.add(product.price_range);
      }
    });
    
    return Array.from(priceRanges).sort();
  }, [products, selectedCategory]);

  // Extract other products product types
  const availableOtherProductTypes = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    const categoryProducts = selectedCategory === 'all' 
      ? products 
      : products.filter(product => product.category === selectedCategory);
    
    const productTypes = new Set<string>();
    categoryProducts.forEach(product => {
      if (product.product_type) {
        productTypes.add(product.product_type);
      }
    });
    
    return Array.from(productTypes).sort();
  }, [products, selectedCategory]);

  // Extract other products materials
  const availableOtherMaterials = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    const categoryProducts = selectedCategory === 'all' 
      ? products 
      : products.filter(product => product.category === selectedCategory);
    
    const materials = new Set<string>();
    categoryProducts.forEach(product => {
      if (product.material) {
        materials.add(product.material);
      }
    });
    
    return Array.from(materials).sort();
  }, [products, selectedCategory]);

  // Extract subcategories from products
  const availableSubcategories = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    const categoryProducts = selectedCategory === 'all' 
      ? products 
      : products.filter(product => product.category === selectedCategory);
    
    const subcategories = [...new Set(categoryProducts.map(p => p.subcategory))].filter(Boolean);
    return subcategories;
  }, [products, selectedCategory]);

  const filteredProducts = React.useMemo(() => {
    // Handle empty products array gracefully
    if (!products || products.length === 0) {
      return [];
    }
    
    let filtered = selectedCategory === 'all' 
      ? products 
      : products.filter(product => product.category === selectedCategory);

    // Filter by search query from URL
    const searchQuery = searchParams.get('search');
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.subcategory.toLowerCase().includes(query) ||
        product.brand?.toLowerCase().includes(query) ||
        product.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Filter by brands
    if (selectedBrands.length > 0) {
      filtered = filtered.filter(product => {
        // Check brand field first
        if (product.brand && selectedBrands.includes(product.brand)) {
          return true;
        }
        // Fallback to tags
        return selectedBrands.some(brand =>
          product.tags.some(tag => tag.toUpperCase() === brand.toUpperCase())
        );
      });
    }

    // Filter by connection types
    if (selectedConnectionTypes.length > 0) {
      filtered = filtered.filter(product =>
        product.connection_types && 
        selectedConnectionTypes.some(type => product.connection_types?.includes(type))
      );
    }

    // Filter by compatibility
    if (selectedCompatibility.length > 0) {
      filtered = filtered.filter(product =>
        product.compatibility && 
        selectedCompatibility.some(comp => product.compatibility?.includes(comp))
      );
    }

    // Filter by form factors
    if (selectedFormFactors.length > 0) {
      filtered = filtered.filter(product =>
        product.form_factor && selectedFormFactors.includes(product.form_factor)
      );
    }

    // Filter by LED types
    if (selectedLedTypes.length > 0) {
      filtered = filtered.filter(product =>
        product.led_type && selectedLedTypes.includes(product.led_type)
      );
    }

    // Filter by features
    if (selectedFeatures.length > 0) {
      filtered = filtered.filter(product =>
        product.features_detailed && 
        selectedFeatures.some(feature => product.features_detailed?.includes(feature))
      );
    }

    // Filter by headset types
    if (selectedHeadsetTypes.length > 0) {
      filtered = filtered.filter(product =>
        product.headset_type && selectedHeadsetTypes.includes(product.headset_type)
      );
    }

    // Filter by use cases
    if (selectedUseCases.length > 0) {
      filtered = filtered.filter(product =>
        product.use_cases && 
        selectedUseCases.some(useCase => product.use_cases?.includes(useCase))
      );
    }

    // Filter by screen sizes
    if (selectedScreenSizes.length > 0) {
      filtered = filtered.filter(product =>
        product.screen_size && selectedScreenSizes.includes(product.screen_size)
      );
    }

    // Filter by refresh rates
    if (selectedRefreshRates.length > 0) {
      filtered = filtered.filter(product =>
        product.refresh_rate && selectedRefreshRates.includes(product.refresh_rate)
      );
    }

    // Filter by resolutions
    if (selectedResolutions.length > 0) {
      filtered = filtered.filter(product =>
        product.resolution && selectedResolutions.includes(product.resolution)
      );
    }

    // Filter by response times
    if (selectedResponseTimes.length > 0) {
      filtered = filtered.filter(product =>
        product.response_time && selectedResponseTimes.includes(product.response_time)
      );
    }

    // Filter by panel types
    if (selectedPanelTypes.length > 0) {
      filtered = filtered.filter(product =>
        product.panel_type && selectedPanelTypes.includes(product.panel_type)
      );
    }

    // Filter by monitor features
    if (selectedMonitorFeatures.length > 0) {
      filtered = filtered.filter(product =>
        product.monitor_features && 
        selectedMonitorFeatures.some(feature => product.monitor_features?.includes(feature))
      );
    }

    // Filter by storage capacities
    if (selectedStorageCapacities.length > 0) {
      filtered = filtered.filter(product =>
        product.storage_capacity && selectedStorageCapacities.includes(product.storage_capacity)
      );
    }

    // Filter by USB types
    if (selectedUsbTypes.length > 0) {
      filtered = filtered.filter(product =>
        product.usb_type && selectedUsbTypes.includes(product.usb_type)
      );
    }

    // Filter by read speeds
    if (selectedReadSpeeds.length > 0) {
      filtered = filtered.filter(product =>
        product.read_speed && selectedReadSpeeds.includes(product.read_speed)
      );
    }

    // Filter by write speeds
    if (selectedWriteSpeeds.length > 0) {
      filtered = filtered.filter(product =>
        product.write_speed && selectedWriteSpeeds.includes(product.write_speed)
      );
    }

    // Filter by memory card types
    if (selectedMemoryCardTypes.length > 0) {
      filtered = filtered.filter(product =>
        product.memory_card_type && selectedMemoryCardTypes.includes(product.memory_card_type)
      );
    }

    // Filter by content types
    if (selectedContentTypes.length > 0) {
      filtered = filtered.filter(product =>
        product.content_type && selectedContentTypes.includes(product.content_type)
      );
    }

    // Filter by format types
    if (selectedFormatTypes.length > 0) {
      filtered = filtered.filter(product =>
        product.format_type && selectedFormatTypes.includes(product.format_type)
      );
    }

    // Filter by license types
    if (selectedLicenseTypes.length > 0) {
      filtered = filtered.filter(product =>
        product.license_type && selectedLicenseTypes.includes(product.license_type)
      );
    }

    // Filter by software compatibility
    if (selectedSoftwareCompatibility.length > 0) {
      filtered = filtered.filter(product =>
        product.software_compatibility && 
        selectedSoftwareCompatibility.some(software => product.software_compatibility?.includes(software))
      );
    }

    // Filter other products by price range
    if (selectedPriceRanges.length > 0) {
      filtered = filtered.filter(product =>
        product.price_range && selectedPriceRanges.includes(product.price_range)
      );
    }

    // Filter other products by product type
    if (selectedProductTypes.length > 0) {
      filtered = filtered.filter(product =>
        product.product_type && selectedProductTypes.includes(product.product_type)
      );
    }

    // Filter other products by material
    if (selectedMaterials.length > 0) {
      filtered = filtered.filter(product =>
        product.material && selectedMaterials.includes(product.material)
      );
    }

    // Filter by subcategories
    if (selectedSubcategories.length > 0) {
      filtered = filtered.filter(product =>
        selectedSubcategories.includes(product.subcategory)
      );
    }

    // Filter by price range
    if (selectedPriceRange) {
      const range = PRICE_RANGES.find(r => r.label === selectedPriceRange);
      if (range) {
        filtered = filtered.filter(product => {
          const price = product.price_vnd;
          return price >= range.min && (range.max === null || price <= range.max);
        });
      }
    }

    // Sort products
    switch (sortBy) {
      case 'price-low':
        return filtered.sort((a, b) => a.price_vnd - b.price_vnd);
      case 'price-high':
        return filtered.sort((a, b) => b.price_vnd - a.price_vnd);
      case 'name':
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [products, selectedCategory, selectedBrands, selectedConnectionTypes, selectedCompatibility, selectedFormFactors, selectedLedTypes, selectedFeatures, selectedHeadsetTypes, selectedUseCases, selectedScreenSizes, selectedRefreshRates, selectedResolutions, selectedResponseTimes, selectedPanelTypes, selectedMonitorFeatures, selectedStorageCapacities, selectedUsbTypes, selectedReadSpeeds, selectedWriteSpeeds, selectedMemoryCardTypes, selectedContentTypes, selectedFormatTypes, selectedLicenseTypes, selectedSoftwareCompatibility, selectedPriceRanges, selectedProductTypes, selectedMaterials, selectedSubcategories, selectedPriceRange, sortBy, searchParams]);

  // For display - client-side pagination on filtered products
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  // Reset to page 1 whenever filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filteredProducts.length, selectedCategory]);

  // Helper: build page number range with ellipsis
  const getPageRange = (current: number, total: number): (number | '...')[] => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | '...')[] = [];
    const delta = 2;
    const left = Math.max(2, current - delta);
    const right = Math.min(total - 1, current + delta);
    pages.push(1);
    if (left > 2) pages.push('...');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < total - 1) pages.push('...');
    pages.push(total);
    return pages;
  };

  const handleBrandToggle = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand)
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  const handleConnectionTypeToggle = (connectionType: string) => {
    setSelectedConnectionTypes(prev =>
      prev.includes(connectionType)
        ? prev.filter(c => c !== connectionType)
        : [...prev, connectionType]
    );

  };

  const handleCompatibilityToggle = (compatibility: string) => {
    setSelectedCompatibility(prev =>
      prev.includes(compatibility)
        ? prev.filter(c => c !== compatibility)
        : [...prev, compatibility]
    );

  };

  const handleFormFactorToggle = (formFactor: string) => {
    setSelectedFormFactors(prev =>
      prev.includes(formFactor)
        ? prev.filter(f => f !== formFactor)
        : [...prev, formFactor]
    );

  };

  const handleLedTypeToggle = (ledType: string) => {
    setSelectedLedTypes(prev =>
      prev.includes(ledType)
        ? prev.filter(l => l !== ledType)
        : [...prev, ledType]
    );

  };

  const handleFeatureToggle = (feature: string) => {
    setSelectedFeatures(prev =>
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );

  };

  const handleHeadsetTypeToggle = (headsetType: string) => {
    setSelectedHeadsetTypes(prev =>
      prev.includes(headsetType)
        ? prev.filter(h => h !== headsetType)
        : [...prev, headsetType]
    );

  };

  const handleUseCaseToggle = (useCase: string) => {
    setSelectedUseCases(prev =>
      prev.includes(useCase)
        ? prev.filter(u => u !== useCase)
        : [...prev, useCase]
    );

  };

  const handleScreenSizeToggle = (screenSize: string) => {
    setSelectedScreenSizes(prev =>
      prev.includes(screenSize)
        ? prev.filter(s => s !== screenSize)
        : [...prev, screenSize]
    );

  };

  const handleRefreshRateToggle = (refreshRate: string) => {
    setSelectedRefreshRates(prev =>
      prev.includes(refreshRate)
        ? prev.filter(r => r !== refreshRate)
        : [...prev, refreshRate]
    );

  };

  const handleResolutionToggle = (resolution: string) => {
    setSelectedResolutions(prev =>
      prev.includes(resolution)
        ? prev.filter(r => r !== resolution)
        : [...prev, resolution]
    );

  };

  const handleResponseTimeToggle = (responseTime: string) => {
    setSelectedResponseTimes(prev =>
      prev.includes(responseTime)
        ? prev.filter(r => r !== responseTime)
        : [...prev, responseTime]
    );

  };

  const handlePanelTypeToggle = (panelType: string) => {
    setSelectedPanelTypes(prev =>
      prev.includes(panelType)
        ? prev.filter(p => p !== panelType)
        : [...prev, panelType]
    );

  };

  const handleMonitorFeatureToggle = (feature: string) => {
    setSelectedMonitorFeatures(prev =>
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );

  };

  // USB filter handlers
  const handleStorageCapacityToggle = (capacity: string) => {
    setSelectedStorageCapacities(prev =>
      prev.includes(capacity)
        ? prev.filter(c => c !== capacity)
        : [...prev, capacity]
    );

  };

  const handleUsbTypeToggle = (usbType: string) => {
    setSelectedUsbTypes(prev =>
      prev.includes(usbType)
        ? prev.filter(u => u !== usbType)
        : [...prev, usbType]
    );

  };

  const handleReadSpeedToggle = (readSpeed: string) => {
    setSelectedReadSpeeds(prev =>
      prev.includes(readSpeed)
        ? prev.filter(r => r !== readSpeed)
        : [...prev, readSpeed]
    );

  };

  const handleWriteSpeedToggle = (writeSpeed: string) => {
    setSelectedWriteSpeeds(prev =>
      prev.includes(writeSpeed)
        ? prev.filter(w => w !== writeSpeed)
        : [...prev, writeSpeed]
    );

  };

  const handleMemoryCardTypeToggle = (cardType: string) => {
    setSelectedMemoryCardTypes(prev =>
      prev.includes(cardType)
        ? prev.filter(c => c !== cardType)
        : [...prev, cardType]
    );

  };

  // Digital filter handlers
  const handleContentTypeToggle = (contentType: string) => {
    setSelectedContentTypes(prev =>
      prev.includes(contentType)
        ? prev.filter(c => c !== contentType)
        : [...prev, contentType]
    );

  };

  const handleFormatTypeToggle = (formatType: string) => {
    setSelectedFormatTypes(prev =>
      prev.includes(formatType)
        ? prev.filter(f => f !== formatType)
        : [...prev, formatType]
    );

  };

  const handleLicenseTypeToggle = (licenseType: string) => {
    setSelectedLicenseTypes(prev =>
      prev.includes(licenseType)
        ? prev.filter(l => l !== licenseType)
        : [...prev, licenseType]
    );

  };

  const handleSoftwareCompatibilityToggle = (software: string) => {
    setSelectedSoftwareCompatibility(prev =>
      prev.includes(software)
        ? prev.filter(s => s !== software)
        : [...prev, software]
    );

  };

  const handleOtherPriceRangeToggle = (priceRange: string) => {
    setSelectedPriceRanges(prev =>
      prev.includes(priceRange)
        ? prev.filter(p => p !== priceRange)
        : [...prev, priceRange]
    );

  };

  const handleOtherProductTypeToggle = (productType: string) => {
    setSelectedProductTypes(prev =>
      prev.includes(productType)
        ? prev.filter(p => p !== productType)
        : [...prev, productType]
    );

  };

  const handleOtherMaterialToggle = (material: string) => {
    setSelectedMaterials(prev =>
      prev.includes(material)
        ? prev.filter(m => m !== material)
        : [...prev, material]
    );

  };

  const handleSubcategoryToggle = (subcategory: string) => {
    setSelectedSubcategories(prev =>
      prev.includes(subcategory)
        ? prev.filter(s => s !== subcategory)
        : [...prev, subcategory]
    );

  };

  const handlePriceRangeChange = (range: string) => {
    setSelectedPriceRange(range === selectedPriceRange ? '' : range);

  };

  const clearAllFilters = () => {
    setSelectedBrands([]);
    setSelectedSubcategories([]);
    setSelectedConnectionTypes([]);
    setSelectedCompatibility([]);
    setSelectedFormFactors([]);
    setSelectedLedTypes([]);
    setSelectedFeatures([]);
    setSelectedHeadsetTypes([]);
    setSelectedUseCases([]);
    setSelectedScreenSizes([]);
    setSelectedRefreshRates([]);
    setSelectedResolutions([]);
    setSelectedResponseTimes([]);
    setSelectedPanelTypes([]);
    setSelectedMonitorFeatures([]);
    setSelectedStorageCapacities([]);
    setSelectedUsbTypes([]);
    setSelectedReadSpeeds([]);
    setSelectedWriteSpeeds([]);
    setSelectedMemoryCardTypes([]);
    setSelectedContentTypes([]);
    setSelectedFormatTypes([]);
    setSelectedLicenseTypes([]);
    setSelectedSoftwareCompatibility([]);
    setSelectedPriceRanges([]);
    setSelectedProductTypes([]);
    setSelectedMaterials([]);
    setSelectedPriceRange('');

  };

  // Dropdown handlers
  const toggleDropdown = (dropdownId: string) => {
    setOpenDropdowns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dropdownId)) {
        newSet.delete(dropdownId);
      } else {
        newSet.clear(); // Close other dropdowns
        newSet.add(dropdownId);
      }
      return newSet;
    });
  };

  const closeAllDropdowns = () => {
    setOpenDropdowns(new Set());
  };

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      closeAllDropdowns();
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Early return for loading/error states BEFORE any useMemo computations
  if (productsLoading || categoriesLoading) {
    return (
      <div className="products-page">
        <div className="loading-container">
          <Spinner size="md" aria-label="Loading products" />
          <p>Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (productsError) {
    return (
      <div className="products-page">
        <div className="products-container">
          <div className="error-state">
            <div className="error-icon-wrapper">
              <i className="fas fa-exclamation-circle"></i>
            </div>
            <h2 className="error-title">Oops! Có lỗi xảy ra</h2>
            <p className="error-message">Không thể tải sản phẩm. Vui lòng thử lại sau.</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="primary"
            >
              <i className="fas fa-sync-alt"></i> Tải lại trang
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Guard: Ensure products array exists before rendering
  // Only show empty state if there's NO search query or filters active
  if (!products || products.length === 0) {
    const hasSearchQuery = searchParams.get('search');
    const hasActiveFilters = 
      selectedBrands.length > 0 || 
      selectedConnectionTypes.length > 0 || 
      selectedCompatibility.length > 0 || 
      selectedPriceRanges.length > 0 ||
      selectedCategory !== 'all';
    
    // If user is searching/filtering, let the page render normally
    // so it can show "No results found" instead of "No products yet"
    if (!hasSearchQuery && !hasActiveFilters) {
      return (
        <div className="products-page">
          <div className="empty-state-container">
            <div className="empty-state-content">
              <div className="empty-icon-wrapper">
                <i className="fas fa-box-open"></i>
              </div>
              <h2 className="empty-title">Chưa Có Sản Phẩm Nào</h2>
              <p className="empty-description">
                Hiện tại chúng tôi chưa có sản phẩm nào trong danh mục này.<br />
                Vui lòng quay lại sau hoặc khám phá các danh mục khác.
              </p>
              <div className="empty-actions">
                <a href="/" className="btn-back-home">
                  <i className="fas fa-home"></i>
                  <span>Về Trang Chủ</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="products-page">
      <div className="products-container">
        {/* Page Header */}
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">
              <i className="fas fa-th-large"></i>
              Tất Cả Sản Phẩm
            </h1>
            {/* Search Query Display */}
            {searchParams.get('search') && (
              <div className="search-query-display">
                <i className="fas fa-search"></i>
                Kết quả tìm kiếm cho: <strong>"{searchParams.get('search')}"</strong>
                <button 
                  className="clear-search-btn"
                  onClick={() => {
                    navigate('/products');
                  }}
                  title="Xóa tìm kiếm"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filters & Controls */}
        <div className="products-controls">
          <div className="filter-section">
            <h3>
              <i className="fas fa-filter"></i>
              Lọc theo danh mục
            </h3>
            <div className="category-filters">
              <button
                className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => {
                  navigate('/products?category=all');
                }}
              >
                <i className="fas fa-th"></i>
                Tất cả ({totalCount || 0})
              </button>
              {categories.map((category) => {
                if (category.id === 'digital') {
                  // ẩn digital
                  return null;
                }
                const count = categoryCounts[category.id] || 0;
                return (
                  <button
                    key={category.id}
                    className={`filter-btn ${selectedCategory === category.id ? 'active' : ''}`}
                    onClick={() => {
                      navigate(`/products?category=${category.id}`);
                    }}
                  >
                    <i className={category.icon}></i>
                    {category.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          <div className="sort-section">
            <h3>
              <i className="fas fa-sort"></i>
              Sắp xếp
            </h3>
            <div className="sort-dropdown" ref={sortDropdownRef}>
              <button
                className={`sort-dropdown-btn ${sortDropdownOpen ? 'open' : ''}`}
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              >
                <span>
                  {sortBy === 'newest' && 'Mới nhất'}
                  {sortBy === 'price-low' && 'Giá thấp đến cao'}
                  {sortBy === 'price-high' && 'Giá cao đến thấp'}
                  {sortBy === 'name' && 'Tên A-Z'}
                </span>
                <i className="fas fa-chevron-down"></i>
              </button>
              
              {sortDropdownOpen && (
                <div className="sort-dropdown-list">
                  <div
                    className={`sort-option ${sortBy === 'newest' ? 'selected' : ''}`}
                    onClick={() => {
                      setSortBy('newest');
                      setSortDropdownOpen(false);
                    }}
                  >
                    <i className="fas fa-clock"></i>
                    <span>Mới nhất</span>
                  </div>
                  <div
                    className={`sort-option ${sortBy === 'price-low' ? 'selected' : ''}`}
                    onClick={() => {
                      setSortBy('price-low');
                      setSortDropdownOpen(false);
                    }}
                  >
                    <i className="fas fa-arrow-down"></i>
                    <span>Giá thấp đến cao</span>
                  </div>
                  <div
                    className={`sort-option ${sortBy === 'price-high' ? 'selected' : ''}`}
                    onClick={() => {
                      setSortBy('price-high');
                      setSortDropdownOpen(false);
                    }}
                  >
                    <i className="fas fa-arrow-up"></i>
                    <span>Giá cao đến thấp</span>
                  </div>
                  <div
                    className={`sort-option ${sortBy === 'name' ? 'selected' : ''}`}
                    onClick={() => {
                      setSortBy('name');
                      setSortDropdownOpen(false);
                    }}
                  >
                    <i className="fas fa-sort-alpha-down"></i>
                    <span>Tên A-Z</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Advanced Filters Section */}
        <div className="advanced-filters-container">{/* Advanced Filters */}
          {/* Dropdown Filters for Keyboard */}
          {selectedCategory === 'keyboard' && (
            <div className="dropdown-filters">
              {availableBrands.length > 0 && (
                <DropdownFilter
                  label="Thương hiệu"
                  icon="fas fa-tags"
                  items={availableBrands}
                  selectedItems={selectedBrands}
                  onItemToggle={handleBrandToggle}
                  isOpen={openDropdowns.has('keyboard-brands')}
                  onToggle={() => toggleDropdown('keyboard-brands')}
                />
              )}

              {availableConnectionTypes.length > 0 && (
                <DropdownFilter
                  label="Kết nối"
                  icon="fas fa-plug"
                  items={availableConnectionTypes}
                  selectedItems={selectedConnectionTypes}
                  onItemToggle={handleConnectionTypeToggle}
                  isOpen={openDropdowns.has('keyboard-connections')}
                  onToggle={() => toggleDropdown('keyboard-connections')}
                />
              )}

              {availableCompatibility.length > 0 && (
                <DropdownFilter
                  label="Tương thích"
                  icon="fas fa-desktop"
                  items={availableCompatibility}
                  selectedItems={selectedCompatibility}
                  onItemToggle={handleCompatibilityToggle}
                  isOpen={openDropdowns.has('keyboard-compatibility')}
                  onToggle={() => toggleDropdown('keyboard-compatibility')}
                />
              )}

              {availableFormFactors.length > 0 && (
                <DropdownFilter
                  label="Loại bàn phím"
                  icon="fas fa-keyboard"
                  items={availableFormFactors}
                  selectedItems={selectedFormFactors}
                  onItemToggle={handleFormFactorToggle}
                  isOpen={openDropdowns.has('keyboard-form-factors')}
                  onToggle={() => toggleDropdown('keyboard-form-factors')}
                />
              )}

              {availableLedTypes.length > 0 && (
                <DropdownFilter
                  label="Đèn LED"
                  icon="fas fa-lightbulb"
                  items={availableLedTypes}
                  selectedItems={selectedLedTypes}
                  onItemToggle={handleLedTypeToggle}
                  isOpen={openDropdowns.has('keyboard-led-types')}
                  onToggle={() => toggleDropdown('keyboard-led-types')}
                />
              )}

              {availableFeatures.length > 0 && (
                <DropdownFilter
                  label="Tiện ích"
                  icon="fas fa-star"
                  items={availableFeatures}
                  selectedItems={selectedFeatures}
                  onItemToggle={handleFeatureToggle}
                  isOpen={openDropdowns.has('keyboard-features')}
                  onToggle={() => toggleDropdown('keyboard-features')}
                />
              )}

              {/* Clear All Filters Button */}
              <button 
                className="clear-all-filters-btn"
                onClick={clearAllFilters}
              >
                <i className="fas fa-times"></i>
                Xóa tất cả
              </button>
            </div>
          )}

          {/* Dropdown Filters for Mouse */}
          {selectedCategory === 'mouse' && (
            <div className="dropdown-filters">
              {availableBrands.length > 0 && (
                <DropdownFilter
                  label="Thương hiệu"
                  icon="fas fa-tags"
                  items={availableBrands}
                  selectedItems={selectedBrands}
                  onItemToggle={handleBrandToggle}
                  isOpen={openDropdowns.has('mouse-brands')}
                  onToggle={() => toggleDropdown('mouse-brands')}
                />
              )}

              {availableConnectionTypes.length > 0 && (
                <DropdownFilter
                  label="Kết nối"
                  icon="fas fa-plug"
                  items={availableConnectionTypes}
                  selectedItems={selectedConnectionTypes}
                  onItemToggle={handleConnectionTypeToggle}
                  isOpen={openDropdowns.has('mouse-connections')}
                  onToggle={() => toggleDropdown('mouse-connections')}
                />
              )}

              {availableCompatibility.length > 0 && (
                <DropdownFilter
                  label="Tương thích"
                  icon="fas fa-desktop"
                  items={availableCompatibility}
                  selectedItems={selectedCompatibility}
                  onItemToggle={handleCompatibilityToggle}
                  isOpen={openDropdowns.has('mouse-compatibility')}
                  onToggle={() => toggleDropdown('mouse-compatibility')}
                />
              )}

              {availableLedTypes.length > 0 && (
                <DropdownFilter
                  label="Đèn LED"
                  icon="fas fa-lightbulb"
                  items={availableLedTypes}
                  selectedItems={selectedLedTypes}
                  onItemToggle={handleLedTypeToggle}
                  isOpen={openDropdowns.has('mouse-led-types')}
                  onToggle={() => toggleDropdown('mouse-led-types')}
                />
              )}

              {availableFeatures.length > 0 && (
                <DropdownFilter
                  label="Tiện ích"
                  icon="fas fa-star"
                  items={availableFeatures}
                  selectedItems={selectedFeatures}
                  onItemToggle={handleFeatureToggle}
                  isOpen={openDropdowns.has('mouse-features')}
                  onToggle={() => toggleDropdown('mouse-features')}
                />
              )}

              {/* Clear All Filters Button */}
              <button 
                className="clear-all-filters-btn"
                onClick={clearAllFilters}
              >
                <i className="fas fa-times"></i>
                Xóa tất cả
              </button>
            </div>
          )}

          {/* Dropdown Filters for Headset */}
          {selectedCategory === 'headset' && (
            <div className="dropdown-filters">
              {availableBrands.length > 0 && (
                <DropdownFilter
                  label="Thương hiệu"
                  icon="fas fa-tags"
                  items={availableBrands}
                  selectedItems={selectedBrands}
                  onItemToggle={handleBrandToggle}
                  isOpen={openDropdowns.has('headset-brands')}
                  onToggle={() => toggleDropdown('headset-brands')}
                />
              )}

              {availableConnectionTypes.length > 0 && (
                <DropdownFilter
                  label="Cổng kết nối"
                  icon="fas fa-plug"
                  items={availableConnectionTypes}
                  selectedItems={selectedConnectionTypes}
                  onItemToggle={handleConnectionTypeToggle}
                  isOpen={openDropdowns.has('headset-connections')}
                  onToggle={() => toggleDropdown('headset-connections')}
                />
              )}

              {availableHeadsetTypes.length > 0 && (
                <DropdownFilter
                  label="Loại tai nghe"
                  icon="fas fa-headphones"
                  items={availableHeadsetTypes}
                  selectedItems={selectedHeadsetTypes}
                  onItemToggle={handleHeadsetTypeToggle}
                  isOpen={openDropdowns.has('headset-types')}
                  onToggle={() => toggleDropdown('headset-types')}
                />
              )}

              {availableUseCases.length > 0 && (
                <DropdownFilter
                  label="Nhu cầu sử dụng"
                  icon="fas fa-bullseye"
                  items={availableUseCases}
                  selectedItems={selectedUseCases}
                  onItemToggle={handleUseCaseToggle}
                  isOpen={openDropdowns.has('headset-use-cases')}
                  onToggle={() => toggleDropdown('headset-use-cases')}
                />
              )}

              {availableFeatures.length > 0 && (
                <DropdownFilter
                  label="Tính năng"
                  icon="fas fa-star"
                  items={availableFeatures}
                  selectedItems={selectedFeatures}
                  onItemToggle={handleFeatureToggle}
                  isOpen={openDropdowns.has('headset-features')}
                  onToggle={() => toggleDropdown('headset-features')}
                />
              )}

              {/* Clear All Filters Button */}
              <button 
                className="clear-all-filters-btn"
                onClick={clearAllFilters}
              >
                <i className="fas fa-times"></i>
                Xóa tất cả
              </button>
            </div>
          )}

          {/* Dropdown Filters for Monitor */}
          {selectedCategory === 'monitor' && (
            <div className="dropdown-filters">
              {availableBrands.length > 0 && (
                <DropdownFilter
                  label="Thương hiệu"
                  icon="fas fa-tags"
                  items={availableBrands}
                  selectedItems={selectedBrands}
                  onItemToggle={handleBrandToggle}
                  isOpen={openDropdowns.has('monitor-brands')}
                  onToggle={() => toggleDropdown('monitor-brands')}
                />
              )}

              {availableScreenSizes.length > 0 && (
                <DropdownFilter
                  label="Kích thước"
                  icon="fas fa-expand-arrows-alt"
                  items={availableScreenSizes}
                  selectedItems={selectedScreenSizes}
                  onItemToggle={handleScreenSizeToggle}
                  isOpen={openDropdowns.has('monitor-screen-sizes')}
                  onToggle={() => toggleDropdown('monitor-screen-sizes')}
                />
              )}

              {availableRefreshRates.length > 0 && (
                <DropdownFilter
                  label="Tần số quét"
                  icon="fas fa-tachometer-alt"
                  items={availableRefreshRates}
                  selectedItems={selectedRefreshRates}
                  onItemToggle={handleRefreshRateToggle}
                  isOpen={openDropdowns.has('monitor-refresh-rates')}
                  onToggle={() => toggleDropdown('monitor-refresh-rates')}
                />
              )}

              {availableResolutions.length > 0 && (
                <DropdownFilter
                  label="Độ phân giải"
                  icon="fas fa-tv"
                  items={availableResolutions}
                  selectedItems={selectedResolutions}
                  onItemToggle={handleResolutionToggle}
                  isOpen={openDropdowns.has('monitor-resolutions')}
                  onToggle={() => toggleDropdown('monitor-resolutions')}
                />
              )}

              {availableResponseTimes.length > 0 && (
                <DropdownFilter
                  label="Thời gian phản hồi"
                  icon="fas fa-clock"
                  items={availableResponseTimes}
                  selectedItems={selectedResponseTimes}
                  onItemToggle={handleResponseTimeToggle}
                  isOpen={openDropdowns.has('monitor-response-times')}
                  onToggle={() => toggleDropdown('monitor-response-times')}
                />
              )}

              {availablePanelTypes.length > 0 && (
                <DropdownFilter
                  label="Tấm nền"
                  icon="fas fa-layer-group"
                  items={availablePanelTypes}
                  selectedItems={selectedPanelTypes}
                  onItemToggle={handlePanelTypeToggle}
                  isOpen={openDropdowns.has('monitor-panel-types')}
                  onToggle={() => toggleDropdown('monitor-panel-types')}
                />
              )}

              {availableConnectionTypes.length > 0 && (
                <DropdownFilter
                  label="Cổng kết nối"
                  icon="fas fa-plug"
                  items={availableConnectionTypes}
                  selectedItems={selectedConnectionTypes}
                  onItemToggle={handleConnectionTypeToggle}
                  isOpen={openDropdowns.has('monitor-connection-types')}
                  onToggle={() => toggleDropdown('monitor-connection-types')}
                />
              )}

              {availableMonitorFeatures.length > 0 && (
                <DropdownFilter
                  label="Tính năng màn hình"
                  icon="fas fa-star"
                  items={availableMonitorFeatures}
                  selectedItems={selectedMonitorFeatures}
                  onItemToggle={handleMonitorFeatureToggle}
                  isOpen={openDropdowns.has('monitor-features')}
                  onToggle={() => toggleDropdown('monitor-features')}
                  multiColumn={true}
                />
              )}

              {/* Clear All Filters Button */}
              <button 
                className="clear-all-filters-btn"
                onClick={clearAllFilters}
              >
                <i className="fas fa-times"></i>
                Xóa tất cả
              </button>
            </div>
          )}

          {/* Dropdown Filters for USB */}
          {selectedCategory === 'usb' && (
            <div className="dropdown-filters">
              {availableBrands.length > 0 && (
                <DropdownFilter
                  label="Thương hiệu"
                  icon="fas fa-tags"
                  items={availableBrands}
                  selectedItems={selectedBrands}
                  onItemToggle={handleBrandToggle}
                  isOpen={openDropdowns.has('usb-brands')}
                  onToggle={() => toggleDropdown('usb-brands')}
                />
              )}

              {availableStorageCapacities.length > 0 && (
                <DropdownFilter
                  label="Dung lượng"
                  icon="fas fa-hdd"
                  items={availableStorageCapacities}
                  selectedItems={selectedStorageCapacities}
                  onItemToggle={handleStorageCapacityToggle}
                  isOpen={openDropdowns.has('usb-storage-capacities')}
                  onToggle={() => toggleDropdown('usb-storage-capacities')}
                />
              )}

              {availableUsbTypes.length > 0 && (
                <DropdownFilter
                  label="Loại USB"
                  icon="fa-brands fa-usb"
                  items={availableUsbTypes}
                  selectedItems={selectedUsbTypes}
                  onItemToggle={handleUsbTypeToggle}
                  isOpen={openDropdowns.has('usb-types')}
                  onToggle={() => toggleDropdown('usb-types')}
                />
              )}

              {availableReadSpeeds.length > 0 && (
                <DropdownFilter
                  label="Tốc độ đọc"
                  icon="fas fa-tachometer-alt"
                  items={availableReadSpeeds}
                  selectedItems={selectedReadSpeeds}
                  onItemToggle={handleReadSpeedToggle}
                  isOpen={openDropdowns.has('usb-read-speeds')}
                  onToggle={() => toggleDropdown('usb-read-speeds')}
                />
              )}

              {availableWriteSpeeds.length > 0 && (
                <DropdownFilter
                  label="Tốc độ ghi"
                  icon="fas fa-edit"
                  items={availableWriteSpeeds}
                  selectedItems={selectedWriteSpeeds}
                  onItemToggle={handleWriteSpeedToggle}
                  isOpen={openDropdowns.has('usb-write-speeds')}
                  onToggle={() => toggleDropdown('usb-write-speeds')}
                />
              )}

              {availableMemoryCardTypes.length > 0 && (
                <DropdownFilter
                  label="Loại thẻ nhớ"
                  icon="fas fa-sd-card"
                  items={availableMemoryCardTypes}
                  selectedItems={selectedMemoryCardTypes}
                  onItemToggle={handleMemoryCardTypeToggle}
                  isOpen={openDropdowns.has('usb-memory-card-types')}
                  onToggle={() => toggleDropdown('usb-memory-card-types')}
                />
              )}

              {/* Clear All Filters Button */}
              <button 
                className="clear-all-filters-btn"
                onClick={clearAllFilters}
              >
                <i className="fas fa-times"></i>
                Xóa tất cả
              </button>
            </div>
          )}

          {/* ẩn digital */}
          {/*
          {selectedCategory === 'digital' && (
            <div className="dropdown-filters">
              {availableBrands.length > 0 && (
                <DropdownFilter
                  label="Thương hiệu"
                  icon="fas fa-tags"
                  items={availableBrands}
                  selectedItems={selectedBrands}
                  onItemToggle={handleBrandToggle}
                  isOpen={openDropdowns.has('digital-brands')}
                  onToggle={() => toggleDropdown('digital-brands')}
                />
              )}

              {availableContentTypes.length > 0 && (
                <DropdownFilter
                  label="Loại nội dung"
                  icon="fas fa-file-alt"
                  items={availableContentTypes}
                  selectedItems={selectedContentTypes}
                  onItemToggle={handleContentTypeToggle}
                  isOpen={openDropdowns.has('digital-content-types')}
                  onToggle={() => toggleDropdown('digital-content-types')}
                />
              )}

              {availableFormatTypes.length > 0 && (
                <DropdownFilter
                  label="Định dạng"
                  icon="fas fa-file-code"
                  items={availableFormatTypes}
                  selectedItems={selectedFormatTypes}
                  onItemToggle={handleFormatTypeToggle}
                  isOpen={openDropdowns.has('digital-format-types')}
                  onToggle={() => toggleDropdown('digital-format-types')}
                />
              )}

              {availableLicenseTypes.length > 0 && (
                <DropdownFilter
                  label="Loại giấy phép"
                  icon="fas fa-certificate"
                  items={availableLicenseTypes}
                  selectedItems={selectedLicenseTypes}
                  onItemToggle={handleLicenseTypeToggle}
                  isOpen={openDropdowns.has('digital-license-types')}
                  onToggle={() => toggleDropdown('digital-license-types')}
                />
              )}

              {availableSoftwareCompatibility.length > 0 && (
                <DropdownFilter
                  label="Tương thích"
                  icon="fas fa-desktop"
                  items={availableSoftwareCompatibility}
                  selectedItems={selectedSoftwareCompatibility}
                  onItemToggle={handleSoftwareCompatibilityToggle}
                  isOpen={openDropdowns.has('digital-software-compatibility')}
                  onToggle={() => toggleDropdown('digital-software-compatibility')}
                />
              )}

              <button 
                className="clear-all-filters-btn"
                onClick={clearAllFilters}
              >
                <i className="fas fa-times"></i>
                Xóa tất cả
              </button>
            </div>
          )}
          */}

          {/* Other Products Filters */}
          {selectedCategory === 'other' && (
            <div className="dropdown-filters">
              {availableBrands.length > 0 && (
                <DropdownFilter
                  label="Thương hiệu"
                  icon="fas fa-tags"
                  items={availableBrands}
                  selectedItems={selectedBrands}
                  onItemToggle={handleBrandToggle}
                  isOpen={openDropdowns.has('other-brands')}
                  onToggle={() => toggleDropdown('other-brands')}
                />
              )}

              {availableOtherPriceRanges.length > 0 && (
                <DropdownFilter
                  label="Khoảng giá"
                  icon="fas fa-dollar-sign"
                  items={availableOtherPriceRanges}
                  selectedItems={selectedPriceRanges}
                  onItemToggle={handleOtherPriceRangeToggle}
                  isOpen={openDropdowns.has('other-price-ranges')}
                  onToggle={() => toggleDropdown('other-price-ranges')}
                />
              )}

              {availableOtherProductTypes.length > 0 && (
                <DropdownFilter
                  label="Loại sản phẩm"
                  icon="fas fa-cube"
                  items={availableOtherProductTypes}
                  selectedItems={selectedProductTypes}
                  onItemToggle={handleOtherProductTypeToggle}
                  isOpen={openDropdowns.has('other-product-types')}
                  onToggle={() => toggleDropdown('other-product-types')}
                />
              )}

              {availableOtherMaterials.length > 0 && (
                <DropdownFilter
                  label="Chất liệu"
                  icon="fas fa-gem"
                  items={availableOtherMaterials}
                  selectedItems={selectedMaterials}
                  onItemToggle={handleOtherMaterialToggle}
                  isOpen={openDropdowns.has('other-materials')}
                  onToggle={() => toggleDropdown('other-materials')}
                />
              )}

              {/* Clear All Filters Button */}
              <button 
                className="clear-all-filters-btn"
                onClick={clearAllFilters}
              >
                <i className="fas fa-times"></i>
                Xóa tất cả
              </button>
            </div>
          )}

          {/* Basic Filters for other categories */}
          {selectedCategory !== 'all' && selectedCategory !== 'keyboard' && selectedCategory !== 'mouse' && selectedCategory !== 'headset' && selectedCategory !== 'monitor' && selectedCategory !== 'usb' && selectedCategory !== 'digital' && selectedCategory !== 'other' && (
            <div className="advanced-filters">
              {/* Brand Filter */}
              {availableBrands.length > 0 && (
                <div className="filter-group">
                  <h4>
                    <i className="fas fa-tags"></i>
                    Thương hiệu
                  </h4>
                  <div className="filter-options">
                    {availableBrands.map((brand) => (
                      <label key={brand} className="filter-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand)}
                          onChange={() => handleBrandToggle(brand)}
                        />
                        <span className="checkmark"></span>
                        {brand}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Subcategory Filter */}
              {availableSubcategories.length > 0 && (
                <div className="filter-group">
                  <h4>
                    <i className="fas fa-layer-group"></i>
                    Loại sản phẩm
                  </h4>
                  <div className="filter-options">
                    {availableSubcategories.map((subcategory) => (
                      <label key={subcategory} className="filter-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedSubcategories.includes(subcategory)}
                          onChange={() => handleSubcategoryToggle(subcategory)}
                        />
                        <span className="checkmark"></span>
                        {subcategory.charAt(0).toUpperCase() + subcategory.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Range Filter */}
              <div className="filter-group">
                <h4>
                  <i className="fas fa-dollar-sign"></i>
                  Khoảng giá
                </h4>
                <div className="filter-options">
                  {PRICE_RANGES.map((range) => (
                    <label key={range.label} className="filter-checkbox">
                      <input
                        type="radio"
                        name="priceRange"
                        checked={selectedPriceRange === range.label}
                        onChange={() => handlePriceRangeChange(range.label)}
                      />
                      <span className="checkmark"></span>
                      {range.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {(selectedBrands.length > 0 || selectedSubcategories.length > 0 || selectedPriceRange) && (
                <div className="filter-actions">
                  <Button variant="secondary" onClick={clearAllFilters}>
                    Xóa bộ lọc
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Products Grid */}
        <div className="products-content">
          {filteredProducts.length > 0 ? (
            <>
              <div className="products-grid">
                {paginatedProducts.map((product) => (
                  <SimpleProductCard
                    key={product.id}
                    product={product}
                    onViewDetails={(id) => navigate(`/product/${id}`)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-btn pagination-arrow"
                    onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    disabled={currentPage === 1}
                    aria-label="Trang trước"
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>

                  {getPageRange(currentPage, totalPages).map((page, idx) =>
                    page === '...' ? (
                      <span key={`ellipsis-${idx}`} className="pagination-ellipsis">...</span>
                    ) : (
                      <button
                        key={page}
                        className={`pagination-btn${currentPage === page ? ' active' : ''}`}
                        onClick={() => { setCurrentPage(page as number); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    className="pagination-btn pagination-arrow"
                    onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    disabled={currentPage === totalPages}
                    aria-label="Trang sau"
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="no-results-container">
              <div className="no-results-content">
                <div className="no-results-icon-wrapper">
                  <i className="fas fa-search"></i>
                </div>
                <h2 className="no-results-title">Không Tìm Thấy Sản Phẩm</h2>
                <p className="no-results-description">
                  {searchParams.get('search') ? (
                    <>
                      Không tìm thấy sản phẩm nào phù hợp với từ khóa <strong>"{searchParams.get('search')}"</strong>.<br />
                      Vui lòng thử lại với từ khóa khác hoặc điều chỉnh bộ lọc.
                    </>
                  ) : (
                    <>
                      Không có sản phẩm nào phù hợp với các tiêu chí lọc đã chọn.<br />
                      Vui lòng điều chỉnh bộ lọc hoặc xóa một số tiêu chí.
                    </>
                  )}
                </p>
                <div className="no-results-actions">
                  {searchParams.get('search') && (
                    <button 
                      className="btn-clear-search"
                      onClick={() => navigate('/products')}
                    >
                      <i className="fas fa-times"></i>
                      <span>Xóa tìm kiếm</span>
                    </button>
                  )}
                  <button 
                    className="btn-clear-filters"
                    onClick={() => {
                      setSelectedCategory('all');
                      clearAllFilters();
                    }}
                  >
                    <i className="fas fa-filter"></i>
                    <span>Xóa tất cả bộ lọc</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;