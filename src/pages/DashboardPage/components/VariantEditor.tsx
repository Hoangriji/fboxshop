/**
 * Product Variant Editor Component
 * Manages variant attributes and variant list for a product
 */

import React, { useState, useEffect } from 'react';
import type { VariantAttribute, ProductVariant } from '../../../types';
import './VariantEditor.css';
import {
  generateVariantSKU,
  generateVariantCombinations,
  getVariantPrice,
  formatPrice,
} from '../../../utils/variantHelpers';

const PREDEFINED_ATTRIBUTES = [
  {
    name: 'color',
    display_name: 'Màu sắc',
    icon: 'fas fa-palette',
  },
  {
    name: 'switch_type',
    display_name: 'Loại switch',
    icon: 'fas fa-keyboard',
  },
  {
    name: 'size',
    display_name: 'Kích thước',
    icon: 'fas fa-ruler',
  },
  {
    name: 'material',
    display_name: 'Chất liệu',
    icon: 'fas fa-cube',
  },
  {
    name: 'layout',
    display_name: 'Layout',
    icon: 'fas fa-th',
  },
  {
    name: 'connection',
    display_name: 'Kết nối',
    icon: 'fas fa-plug',
  }
];

interface VariantEditorProps {
  baseSKU: string;
  basePrice: number;
  variantAttributes: VariantAttribute[];
  variants: ProductVariant[];
  onChange: (attributes: VariantAttribute[], variants: ProductVariant[]) => void;
}

export const VariantEditor: React.FC<VariantEditorProps> = ({
  baseSKU,
  basePrice,
  variantAttributes,
  variants,
  onChange,
}) => {
  const [attributes, setAttributes] = useState<VariantAttribute[]>(variantAttributes);
  const [variantList, setVariantList] = useState<ProductVariant[]>(variants);
  const [selectedAttrType, setSelectedAttrType] = useState('');
  const [customValues, setCustomValues] = useState<{ [key: number]: string }>({});
  const [suggestions, setSuggestions] = useState<{ [key: number]: string[] }>({});
  const [showSuggestions, setShowSuggestions] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    onChange(attributes, variantList);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantList, attributes]);

  const getSuggestionsFromStorage = (attrName: string, query: string): string[] => {
    const storageKey = `variant_values_${attrName}`;
    const stored = localStorage.getItem(storageKey);
    if (!stored) return [];
    
    try {
      const values: string[] = JSON.parse(stored);
      return values.filter(v => 
        v.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);
    } catch {
      return [];
    }
  };

  const saveValueToStorage = (attrName: string, value: string) => {
    const storageKey = `variant_values_${attrName}`;
    const stored = localStorage.getItem(storageKey);
    let values: string[] = [];
    
    try {
      values = stored ? JSON.parse(stored) : [];
    } catch {
      values = [];
    }
    
    if (!values.includes(value)) {
      values.push(value);
      localStorage.setItem(storageKey, JSON.stringify(values));
    }
  };

  const handleInputChange = (attrIndex: number, value: string) => {
    setCustomValues({ ...customValues, [attrIndex]: value });
    
    if (value.trim().length > 0) {
      const attr = attributes[attrIndex];
      const suggs = getSuggestionsFromStorage(attr.name, value);
      setSuggestions({ ...suggestions, [attrIndex]: suggs });
      setShowSuggestions({ ...showSuggestions, [attrIndex]: true });
    } else {
      setShowSuggestions({ ...showSuggestions, [attrIndex]: false });
    }
  };

  const handleAddAttribute = () => {
    if (!selectedAttrType) return;
    
    const predefined = PREDEFINED_ATTRIBUTES.find(a => a.name === selectedAttrType);
    if (!predefined) return;
    
    if (attributes.some(a => a.name === predefined.name)) {
      alert('Thuộc tính này đã được thêm');
      return;
    }
    
    const newAttribute: VariantAttribute = {
      name: predefined.name,
      display_name: predefined.display_name,
      values: [],
    };
    setAttributes([...attributes, newAttribute]);
    setSelectedAttrType('');
  };

  const handleRemoveAttribute = (index: number) => {
    const updated = attributes.filter((_, i) => i !== index);
    setAttributes(updated);
  };

  const handleAddAttributeValue = (attrIndex: number, value: string) => {
    if (!value.trim()) return;
    const updated = [...attributes];
    if (!updated[attrIndex].values.includes(value.trim())) {
      updated[attrIndex].values.push(value.trim());
      setAttributes(updated);
      saveValueToStorage(updated[attrIndex].name, value.trim());
    }
    setCustomValues({ ...customValues, [attrIndex]: '' });
    setShowSuggestions({ ...showSuggestions, [attrIndex]: false });
  };

  const handleRemoveAttributeValue = (attrIndex: number, valueIndex: number) => {
    const updated = [...attributes];
    updated[attrIndex].values = updated[attrIndex].values.filter((_, i) => i !== valueIndex);
    setAttributes(updated);
  };

  // Auto-generate variants from combinations
  const handleGenerateVariants = () => {
    if (attributes.length === 0) return;
    
    // Validate attributes
    const validAttributes = attributes.filter(
      (attr) => attr.name && attr.display_name && attr.values.length > 0
    );
    
    if (validAttributes.length === 0) {
      alert('Vui lòng thêm ít nhất 1 thuộc tính với giá trị hợp lệ');
      return;
    }

    const combinations = generateVariantCombinations(validAttributes);
    const newVariants: ProductVariant[] = combinations.map((combo, index) => {
      const variantId = `var_${Date.now()}_${index}`;
      const sku = generateVariantSKU(baseSKU, combo);
      
      return {
        id: variantId,
        sku,
        attributes: combo,
        price_adjustment: 0,
        stock: 0,
        is_available: true,
      };
    });

    setVariantList(newVariants);
  };

  // Update variant field
  const handleUpdateVariant = (
    variantId: string,
    field: keyof ProductVariant,
    value: string | number | boolean | Record<string, string>
  ) => {
    const updated = variantList.map((v) =>
      v.id === variantId ? { ...v, [field]: value } : v
    );
    setVariantList(updated);
  };

  // Regenerate SKU for variant
  const handleRegenerateSKU = (variantId: string) => {
    const variant = variantList.find((v) => v.id === variantId);
    if (!variant) return;

    const newSKU = generateVariantSKU(baseSKU, variant.attributes);
    handleUpdateVariant(variantId, 'sku', newSKU);
  };

  // Delete variant
  const handleDeleteVariant = (variantId: string) => {
    if (variantList.length === 1) {
      alert('Phải có ít nhất 1 variant');
      return;
    }
    setVariantList(variantList.filter((v) => v.id !== variantId));
  };

  return (
    <div className="pv-editor">
      <div className="pv-section">
        <div className="pv-section-header">
          <h3>
            <i className="fas fa-tags"></i>
            Cấu hình thuộc tính
          </h3>
          <p className="pv-section-desc">
            Chọn thuộc tính và giá trị cho biến thể sản phẩm
          </p>
        </div>

        <div className="pv-add-attribute">
          <select
            className="pv-input"
            value={selectedAttrType}
            onChange={(e) => setSelectedAttrType(e.target.value)}
          >
            <option value="">Chọn thuộc tính...</option>
            {PREDEFINED_ATTRIBUTES.map((attr) => (
              <option key={attr.name} value={attr.name} disabled={attributes.some(a => a.name === attr.name)}>
                {attr.display_name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="pv-btn pv-btn-primary"
            onClick={handleAddAttribute}
            disabled={!selectedAttrType}
          >
            <i className="fas fa-plus"></i> Thêm thuộc tính
          </button>
        </div>

        <div className="pv-attributes-list">
          {attributes.map((attr, attrIndex) => {
            const predefined = PREDEFINED_ATTRIBUTES.find(a => a.name === attr.name);
            return (
              <div key={attrIndex} className="pv-attribute-card">
                <div className="pv-attribute-header">
                  <h4>
                    {predefined && <i className={predefined.icon}></i>}
                    {attr.display_name}
                  </h4>
                  <button
                    type="button"
                    className="pv-btn-icon-small pv-btn-danger-small"
                    onClick={() => handleRemoveAttribute(attrIndex)}
                    title="Xóa thuộc tính"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>

                <div className="pv-attribute-values">
                  <div className="pv-values-list">
                    {attr.values.map((value, valueIndex) => (
                      <div key={valueIndex} className="pv-value-tag">
                        <span>{value}</span>
                        <button
                          type="button"
                          className="pv-value-remove"
                          onClick={() => handleRemoveAttributeValue(attrIndex, valueIndex)}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pv-autocomplete-container">
                    <div className="pv-value-input-group">
                      <input
                        type="text"
                        className="pv-input pv-input-inline"
                        placeholder="Nhập giá trị (VD: Pink, Blue, Red)..."
                        value={customValues[attrIndex] || ''}
                        onChange={(e) => handleInputChange(attrIndex, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddAttributeValue(attrIndex, customValues[attrIndex] || '');
                          }
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowSuggestions({ ...showSuggestions, [attrIndex]: false }), 200);
                        }}
                      />
                      <button
                        type="button"
                        className="pv-btn-add-value"
                        onClick={() => handleAddAttributeValue(attrIndex, customValues[attrIndex] || '')}
                        disabled={!customValues[attrIndex]?.trim()}
                        title="Thêm giá trị (hoặc nhấn Enter)"
                      >
                        <i className="fas fa-plus"></i>
                        <span>Thêm</span>
                      </button>
                    </div>
                    {showSuggestions[attrIndex] && suggestions[attrIndex]?.length > 0 && (
                      <div className="pv-suggestions">
                        {suggestions[attrIndex].map((suggestion, idx) => (
                          <div
                            key={idx}
                            className="pv-suggestion-item"
                            onClick={() => handleAddAttributeValue(attrIndex, suggestion)}
                          >
                            <i className="fas fa-history"></i>
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {attributes.length === 0 && (
          <div className="pv-empty-state">
            <i className="fas fa-info-circle"></i>
            <p>Chưa có thuộc tính nào. Chọn thuộc tính từ danh sách phía trên.</p>
          </div>
        )}

        <div className="pv-section-actions">
          <button
            type="button"
            className="pv-btn pv-btn-primary"
            onClick={handleGenerateVariants}
            disabled={attributes.length === 0}
          >
            <i className="fas fa-magic"></i>
            Tạo tất cả biến thể
          </button>
        </div>
      </div>

      {/* Variants Table */}
      {variantList.length > 0 && (
        <div className="pv-section">
          <div className="pv-section-header">
            <h3>
              <i className="fas fa-list"></i>
              Danh sách biến thể ({variantList.length})
            </h3>
            <p className="pv-section-desc">
              Chỉnh sửa giá, tồn kho và SKU cho từng biến thể
            </p>
          </div>

          <div className="pv-variants-table-wrapper">
            <table className="pv-variants-table">
              <thead>
                <tr>
                  <th>Thuộc tính</th>
                  <th>SKU</th>
                  <th>Chênh lệch giá</th>
                  <th>Giá cuối</th>
                  <th>Tồn kho</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {variantList.map((variant) => (
                  <tr key={variant.id} className={!variant.is_available ? 'pv-variant-disabled' : ''}>
                    <td>
                      <div className="pv-variant-attrs">
                        {Object.entries(variant.attributes).map(([key, value]) => (
                          <span key={key} className="pv-attr-badge">
                            {value}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="pv-sku-cell">
                        <input
                          type="text"
                          className="pv-input pv-input-table"
                          value={variant.sku}
                          onChange={(e) =>
                            handleUpdateVariant(variant.id, 'sku', e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.preventDefault();
                          }}
                        />
                        <button
                          type="button"
                          className="pv-btn-icon-small"
                          onClick={() => handleRegenerateSKU(variant.id)}
                          title="Tạo lại SKU"
                        >
                          <i className="fas fa-sync"></i>
                        </button>
                      </div>
                    </td>
                    <td>
                      <input
                        type="number"
                        className="pv-input pv-input-table pv-input-number"
                        value={variant.price_adjustment}
                        onChange={(e) =>
                          handleUpdateVariant(
                            variant.id,
                            'price_adjustment',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.preventDefault();
                        }}
                        step="10000"
                      />
                    </td>
                    <td>
                      <span className="pv-price-display">
                        {formatPrice(getVariantPrice(basePrice, variant.price_adjustment))}
                      </span>
                    </td>
                    <td>
                      <input
                        type="number"
                        className="pv-input pv-input-table pv-input-number"
                        value={variant.stock}
                        onChange={(e) =>
                          handleUpdateVariant(
                            variant.id,
                            'stock',
                            parseInt(e.target.value) || 0
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.preventDefault();
                        }}
                        min="0"
                      />
                    </td>
                    <td>
                      <label className="pv-switch">
                        <input
                          type="checkbox"
                          checked={variant.is_available}
                          onChange={(e) =>
                            handleUpdateVariant(variant.id, 'is_available', e.target.checked)
                          }
                        />
                        <span className="pv-switch-slider"></span>
                      </label>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="pv-btn pv-btn-icon pv-btn-danger-small"
                        onClick={() => handleDeleteVariant(variant.id)}
                        title="Xóa variant"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
