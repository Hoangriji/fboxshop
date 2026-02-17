import React from 'react';
import type { VariantAttribute, ProductVariant } from '../../types';
import './VariantSelector.css';

interface VariantSelectorProps {
  variantAttributes: VariantAttribute[];
  variants: ProductVariant[];
  selectedAttributes: Record<string, string>;
  onAttributeChange: (attributeName: string, value: string) => void;
  currentVariant?: ProductVariant;
}

export const VariantSelector: React.FC<VariantSelectorProps> = ({
  variantAttributes,
  variants,
  selectedAttributes,
  onAttributeChange,
  currentVariant
}) => {
  // Check if a value is available for selection
  const isValueAvailable = (attributeName: string, value: string): boolean => {
    // Clone selected attributes and set the current value
    const testSelection = { ...selectedAttributes, [attributeName]: value };
    
    // Check if any variant matches this combination
    return variants.some(variant => {
      return Object.entries(testSelection).every(([key, val]) => {
        if (!val) return true; // Skip unselected attributes
        return variant.attributes[key] === val;
      });
    });
  };

  // Get stock count for a specific value
  const getStockForValue = (attributeName: string, value: string): number => {
    const testSelection = { ...selectedAttributes, [attributeName]: value };
    
    // Find matching variants
    const matchingVariants = variants.filter(variant => {
      return Object.entries(testSelection).every(([key, val]) => {
        if (!val) return true;
        return variant.attributes[key] === val;
      });
    });
    
    // Sum up stock
    return matchingVariants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
  };

  return (
    <div className="variant-selector">
      {variantAttributes.map((attribute) => (
        <div key={attribute.name} className="variant-attribute">
          <div className="variant-attribute-header">
            <label className="variant-attribute-label">
              {attribute.display_name}
            </label>
            {selectedAttributes[attribute.name] && (
              <span className="variant-selected-value">
                {selectedAttributes[attribute.name]}
              </span>
            )}
          </div>
          
          <div className="variant-options">
            {attribute.values.map((value) => {
              const isAvailable = isValueAvailable(attribute.name, value);
              const isSelected = selectedAttributes[attribute.name] === value;
              const stock = getStockForValue(attribute.name, value);
              
              return (
                <button
                  key={value}
                  type="button"
                  className={`variant-option ${isSelected ? 'selected' : ''} ${!isAvailable ? 'unavailable' : ''}`}
                  onClick={() => onAttributeChange(attribute.name, value)}
                  disabled={!isAvailable}
                  title={!isAvailable ? 'Không có sẵn' : `Còn ${stock} sản phẩm`}
                >
                  <span className="variant-option-value">{value}</span>
                  {!isAvailable && (
                    <i className="fas fa-ban variant-unavailable-icon"></i>
                  )}
                  {isSelected && (
                    <i className="fas fa-check variant-selected-icon"></i>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Current Variant Info */}
      {currentVariant && (
        <div className="variant-current-info">
          <div className="variant-sku">
            <i className="fas fa-barcode"></i>
            <span>SKU: {currentVariant.sku}</span>
          </div>
          <div className="variant-stock">
            <i className={`fas fa-box ${currentVariant.stock > 10 ? 'text-success' : currentVariant.stock > 0 ? 'text-warning' : 'text-danger'}`}></i>
            <span>
              {currentVariant.stock > 0 
                ? `Còn ${currentVariant.stock} sản phẩm` 
                : 'Hết hàng'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
