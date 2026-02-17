import type { Product, ProductVariant, VariantAttribute } from '../types';

function removeVietnameseDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toUpperCase();
}

export function generateVariantSKU(
  baseSKU: string,
  attributes: Record<string, string>
): string {
  const attributeParts = Object.values(attributes)
    .map((value) => {
      // Remove Vietnamese diacritics and special chars
      let cleaned = removeVietnameseDiacritics(value);
      // Remove special characters except hyphen
      cleaned = cleaned.replace(/[^A-Z0-9-\s]/g, '');
      // Replace spaces with hyphens
      cleaned = cleaned.replace(/\s+/g, '-');
      // Limit length to 15 chars
      return cleaned.substring(0, 15);
    })
    .filter(Boolean)
    .join('-');

  return `${baseSKU}-${attributeParts}`;
}

export function getVariantPrice(basePrice: number, priceAdjustment: number): number {
  return basePrice + priceAdjustment;
}

export function getTotalVariantStock(variants: ProductVariant[]): number {
  return variants.reduce((total, variant) => total + variant.stock, 0);
}

export function getAvailableVariants(variants: ProductVariant[]): ProductVariant[] {
  return variants.filter((v) => v.is_available && v.stock > 0);
}

export function getVariantPriceRange(
  basePrice: number,
  variants: ProductVariant[]
): { min: number; max: number } {
  const prices = variants.map((v) => getVariantPrice(basePrice, v.price_adjustment));
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

export function formatVariantAttributes(
  attributes: Record<string, string>,
  separator: string = ' - '
): string {
  return Object.values(attributes).join(separator);
}

export function getVariantById(
  variants: ProductVariant[],
  variantId: string
): ProductVariant | undefined {
  return variants.find((v) => v.id === variantId);
}

export function getVariantByAttributes(
  variants: ProductVariant[],
  selectedAttributes: Record<string, string>
): ProductVariant | undefined {
  return variants.find((variant) => {
    return Object.entries(selectedAttributes).every(
      ([key, value]) => variant.attributes[key] === value
    );
  });
}

export function generateVariantCombinations(
  attributes: VariantAttribute[]
): Record<string, string>[] {
  if (attributes.length === 0) return [];
  if (attributes.length === 1) {
    return attributes[0].values.map((value) => ({
      [attributes[0].name]: value,
    }));
  }

  const [first, ...rest] = attributes;
  const restCombinations = generateVariantCombinations(rest);

  const combinations: Record<string, string>[] = [];
  for (const value of first.values) {
    for (const restCombo of restCombinations) {
      combinations.push({
        [first.name]: value,
        ...restCombo,
      });
    }
  }

  return combinations;
}

export function validateVariant(variant: ProductVariant): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!variant.sku || variant.sku.trim() === '') {
    errors.push('SKU không được để trống');
  }

  if (variant.stock < 0) {
    errors.push('Số lượng tồn kho không được âm');
  }

  if (Object.keys(variant.attributes).length === 0) {
    errors.push('Variant phải có ít nhất 1 thuộc tính');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function isSkuUnique(sku: string, variants: ProductVariant[], excludeId?: string): boolean {
  return !variants.some((v) => v.id !== excludeId && v.sku === sku);
}

export function getAttributeIcon(attributeName: string): string {
  const iconMap: Record<string, string> = {
    color: 'fas fa-palette',
    switch_type: 'fas fa-keyboard',
    size: 'fas fa-ruler',
    material: 'fas fa-cube',
    connection: 'fas fa-plug',
    layout: 'fas fa-th',
  };
  return iconMap[attributeName] || 'fas fa-box';
}

export function formatPrice(price: number): string {
  return price.toLocaleString('vi-VN') + '₫';
}

export function getLowestPricedVariant(
  basePrice: number,
  variants: ProductVariant[]
): ProductVariant | undefined {
  if (variants.length === 0) return undefined;
  
  return variants.reduce((lowest, current) => {
    const lowestPrice = getVariantPrice(basePrice, lowest.price_adjustment);
    const currentPrice = getVariantPrice(basePrice, current.price_adjustment);
    return currentPrice < lowestPrice ? current : lowest;
  });
}

export function hasValidVariantsConfig(product: Product): boolean {
  if (!product.has_variants) return true;
  
  if (!product.variant_attributes || product.variant_attributes.length === 0) {
    return false;
  }
  
  if (!product.variants || product.variants.length === 0) {
    return false;
  }
  
  if (typeof product.base_price !== 'number') {
    return false;
  }
  
  // Check if at least one variant is available
  return product.variants.some((v) => v.is_available && v.stock > 0);
}
export function generateSKUFromName(productName: string): string {
  let cleaned = removeVietnameseDiacritics(productName);
  cleaned = cleaned.replace(/[^A-Z0-9\s]/g, '');
  const words = cleaned.split(/\s+/).filter(Boolean);
  
  if (words.length === 0) return 'PROD-' + Date.now().toString().slice(-6);
  
  const acronym = words.length > 1 
    ? words.map(w => w[0]).join('').substring(0, 4)
    : words[0].substring(0, 4);
  
  const suffix = Date.now().toString().slice(-4);
  return `${acronym}-${suffix}`;
}