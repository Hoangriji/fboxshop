import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addDoc, collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useProducts } from '../../../hooks/useProducts';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import { Toast } from '../../../components/Toast';
import { sendInvoiceEmail } from '../../../utils/invoiceEmail';
import type { Product } from '../../../types';

interface Customer {
  phone: string;
  name: string;
  email: string;
  address: string;
}

type CustomerSummary = Pick<Customer, 'phone' | 'name'>;

interface ProductSnapshot {
  id: string;
  name: string;
  sku: string;
  serialNumber: string;
  quantity: number;
  warrantyMonths: number;
  price: number;
  productDiscount: number;
}

type OrderStatus = 'Pending' | 'Partial' | 'Paid';

interface Order {
  id: string;
  customerSnapshot: Customer;
  items: ProductSnapshot[];
  shippingFee: number;
  orderDiscount: number;
  paidAmount: number;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  order?: Order | null;
}

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateOrder: (order: Order) => void;
  onInvoiceSent: () => void;
}

interface CustomerHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerSummary | null;
  orders: Order[];
  onSelectOrder: (order: Order) => void;
}

type LookupStatus = 'idle' | 'loading' | 'found' | 'not_found' | 'error';

interface LookupState {
  status: LookupStatus;
  message: string;
}

interface OrderItemDraft extends ProductSnapshot {
  lineId: string;
}

interface InvoicePreviewProps {
  order: Order;
}

const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; className: string; icon: string }> = {
  Pending: { label: 'Chờ thanh toán', className: 'out_of_stock', icon: 'fa-hourglass-half' },
  Partial: { label: 'Thanh toán một phần', className: 'low_stock', icon: 'fa-exclamation-circle' },
  Paid: { label: 'Đã thanh toán', className: 'in_stock', icon: 'fa-check-circle' },
};

const MIN_PHONE_LENGTH = 8;


const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')} đ`;

const formatDateTime = (value: string) => new Date(value).toLocaleString('vi-VN');

const normalizePhone = (value: string) => value.replace(/\D/g, '');

const parseNumberInput = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

const formatCurrencyInput = (value: number) => value.toLocaleString('vi-VN');

const parseCurrencyInput = (value: string) => {
  const cleaned = value.replace(/\D/g, '');
  return cleaned ? Number(cleaned) : 0;
};

const generateLineId = () => {
  return `line-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

const generateSerialNumber = () => {
  return `SN-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
};

const generateOrderId = () => {
  const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `ORD-${dateStamp}-${randomSuffix}`;
};

const resolveOrderStatus = (total: number, paid: number): OrderStatus => {
  if (total <= 0) return 'Paid';
  if (paid <= 0) return 'Pending';
  if (paid >= total) return 'Paid';
  return 'Partial';
};

const fetchCustomerByPhone = async (phone: string): Promise<Customer | null> => {
  const phoneValue = phone.trim();
  if (!phoneValue) return null;

  const customersRef = collection(db, 'customers');
  const ordersRef = collection(db, 'orders');

  const lookupCustomerCollection = async (value: string) => {
    const snapshot = await getDocs(query(customersRef, where('phone', '==', value), limit(1)));
    if (snapshot.empty) return null;
    const data = snapshot.docs[0].data() as Partial<Customer>;
    return {
      phone: data.phone ?? value,
      name: data.name ?? '',
      email: data.email ?? '',
      address: data.address ?? '',
    };
  };

  const lookupOrdersCollection = async (value: string) => {
    const snapshot = await getDocs(query(ordersRef, where('customerSnapshot.phone', '==', value), limit(20)));
    if (snapshot.empty) return null;

    const latestOrder = snapshot.docs
      .map((doc) => doc.data() as Partial<Order>)
      .filter((order) => order.customerSnapshot?.phone)
      .sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      })[0];

    if (!latestOrder?.customerSnapshot) return null;

    return {
      phone: latestOrder.customerSnapshot.phone ?? value,
      name: latestOrder.customerSnapshot.name ?? '',
      email: latestOrder.customerSnapshot.email ?? '',
      address: latestOrder.customerSnapshot.address ?? '',
    };
  };

  const primary = await lookupCustomerCollection(phoneValue);
  if (primary) return primary;

  const orderMatch = await lookupOrdersCollection(phoneValue);
  if (orderMatch) return orderMatch;

  const normalized = normalizePhone(phoneValue);
  if (normalized && normalized !== phoneValue) {
    const normalizedCustomer = await lookupCustomerCollection(normalized);
    if (normalizedCustomer) return normalizedCustomer;
    return lookupOrdersCollection(normalized);
  }

  return null;
};

const getItemsSummary = (items: ProductSnapshot[]) => {
  if (items.length === 0) return 'Không có sản phẩm';
  if (items.length === 1) return items[0].name;
  return `${items[0].name} +${items.length - 1} sản phẩm`;
};

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ order }) => {
  const subtotal = useMemo(
    () => order.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [order.items]
  );
  const discountTotal = useMemo(() => {
    const productDiscounts = order.items.reduce(
      (sum, item) => sum + Math.min(item.productDiscount, item.price) * item.quantity,
      0
    );
    return productDiscounts + order.orderDiscount;
  }, [order.items, order.orderDiscount]);
  const balance = useMemo(() => Math.max(0, order.totalAmount - order.paidAmount), [order.totalAmount, order.paidAmount]);
  const statusConfig = ORDER_STATUS_CONFIG[order.status];

  return (
    <>
      <div className="form-section">
        <h3 className="form-section-title">
          <i className="fas fa-file-invoice"></i>
          Thông tin đơn hàng
        </h3>
        <div className="form-row-2">
          <div className="form-group">
            <label>Mã đơn</label>
            <input type="text" value={order.id} readOnly />
          </div>
          <div className="form-group">
            <label>Ngày tạo</label>
            <input type="text" value={formatDateTime(order.createdAt)} readOnly />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Trạng thái</label>
            <span className={`status-badge ${statusConfig.className}`}>
              <i className={`fas ${statusConfig.icon}`}></i> {statusConfig.label}
            </span>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3 className="form-section-title">
          <i className="fas fa-user"></i>
          Thông tin khách hàng
        </h3>
        <div className="form-row-2">
          <div className="form-group">
            <label>Họ tên</label>
            <input type="text" value={order.customerSnapshot.name} readOnly />
          </div>
          <div className="form-group">
            <label>Số điện thoại</label>
            <input type="text" value={order.customerSnapshot.phone} readOnly />
          </div>
        </div>
        <div className="form-row-2">
          <div className="form-group">
            <label>Email</label>
            <input type="text" value={order.customerSnapshot.email || '—'} readOnly />
          </div>
          <div className="form-group">
            <label>Địa chỉ</label>
            <input type="text" value={order.customerSnapshot.address || '—'} readOnly />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3 className="form-section-title">
          <i className="fas fa-boxes-stacked"></i>
          Sản phẩm
        </h3>
        <div className="products-table-wrapper">
          <div className="table-container">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>S/N</th>
                  <th>Bảo hành</th>
                  <th>Giá</th>
                  <th>Số lượng</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.serialNumber}>
                    <td>
                      <div className="product-name">
                        <strong>{item.name}</strong>
                        <span className="product-id">SKU: {item.sku}</span>
                      </div>
                    </td>
                    <td>
                      <span className="product-id">{item.serialNumber}</span>
                    </td>
                    <td>{item.warrantyMonths} tháng</td>
                    <td>{formatCurrency(item.price)}</td>
                    <td>{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3 className="form-section-title">
          <i className="fas fa-calculator"></i>
          Tổng kết
        </h3>
        <div className="form-row-2">
          <div className="form-group">
            <label>Tạm tính</label>
            <input type="text" value={formatCurrency(subtotal)} readOnly />
          </div>
          <div className="form-group">
            <label>Phí vận chuyển</label>
            <input type="text" value={formatCurrency(order.shippingFee)} readOnly />
          </div>
        </div>
        <div className="form-row-2">
          <div className="form-group">
            <label>Giảm giá</label>
            <input type="text" value={formatCurrency(discountTotal)} readOnly />
          </div>
          <div className="form-group">
            <label>Tổng cộng</label>
            <input type="text" value={formatCurrency(order.totalAmount)} readOnly />
          </div>
        </div>
        <div className="form-row-2">
          <div className="form-group">
            <label>Đã thanh toán</label>
            <input type="text" value={formatCurrency(order.paidAmount)} readOnly />
          </div>
          <div className="form-group">
            <label>Còn lại</label>
            <input type="text" value={formatCurrency(balance)} readOnly />
          </div>
        </div>
      </div>
    </>
  );
};

const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  onCreateOrder,
  onInvoiceSent,
}) => {
  const { products, loading: productsLoading } = useProducts();
  const [customer, setCustomer] = useState<Customer>({
    phone: '',
    name: '',
    email: '',
    address: '',
  });
  const [step, setStep] = useState<'edit' | 'preview'>('edit');
  const [draftOrder, setDraftOrder] = useState<Order | null>(null);
  const [lookupState, setLookupState] = useState<LookupState>({ status: 'idle', message: '' });
  const [selectedProductId, setSelectedProductId] = useState('');
  const [items, setItems] = useState<OrderItemDraft[]>([]);
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingFeeInput, setShippingFeeInput] = useState('0');
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [orderDiscountInput, setOrderDiscountInput] = useState('0');
  const [paidAmount, setPaidAmount] = useState(0);
  const [paidAmountInput, setPaidAmountInput] = useState('0');
  const [formError, setFormError] = useState('');
  const [sendError, setSendError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const modalContentRef = useRef<HTMLDivElement | null>(null);

  const normalizedPhone = normalizePhone(customer.phone);

  const handleCustomerChange = (field: keyof Customer, value: string) => {
    setCustomer((prev) => ({ ...prev, [field]: value }));
    if (field === 'phone') {
      setLookupState({ status: 'idle', message: '' });
    }
  };

  const handleLookup = useCallback(async () => {
    if (normalizedPhone.length < MIN_PHONE_LENGTH) {
      setLookupState({ status: 'idle', message: '' });
      return;
    }

    setLookupState({ status: 'loading', message: 'Đang tra cứu khách hàng...' });
    try {
      const found = await fetchCustomerByPhone(customer.phone);
      if (found) {
        setCustomer((prev) => ({
          ...prev,
          name: found.name,
          email: found.email,
          address: found.address,
        }));
        setLookupState({ status: 'found', message: 'Khách hàng cũ tự động điền thông tin tương ứng.' });
        return;
      }

      setLookupState({ status: 'not_found', message: 'Không tìm thấy khách hàng. Vui lòng nhập thông tin mới.' });
    } catch {
      setLookupState({ status: 'error', message: 'Không thể tra cứu khách hàng.' });
    }
  }, [customer.phone, normalizedPhone]);

  const resetDraft = () => {
    setCustomer({ phone: '', name: '', email: '', address: '' });
    setLookupState({ status: 'idle', message: '' });
    setSelectedProductId('');
    setItems([]);
    setShippingFee(0);
    setShippingFeeInput('0');
    setOrderDiscount(0);
    setOrderDiscountInput('0');
    setPaidAmount(0);
    setPaidAmountInput('0');
    setFormError('');
    setSendError('');
    setDraftOrder(null);
    setStep('edit');
    setIsExitConfirmOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    resetDraft();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || step !== 'preview') return;
    requestAnimationFrame(() => {
      modalContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }, [isOpen, step]);

  useEffect(() => {
    if (!isOpen) return;
    if (normalizedPhone.length < MIN_PHONE_LENGTH) {
      setLookupState({ status: 'idle', message: '' });
      return;
    }

    const timer = setTimeout(() => {
      void handleLookup();
    }, 400);

    return () => clearTimeout(timer);
  }, [normalizedPhone, isOpen, handleLookup]);

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const hasFormValues = useMemo(() => (
    Boolean(
      customer.phone.trim()
      || customer.name.trim()
      || customer.email.trim()
      || customer.address.trim()
      || selectedProductId
      || items.length
      || shippingFee
      || orderDiscount
      || paidAmount
      || draftOrder
    )
  ), [
    customer.phone,
    customer.name,
    customer.email,
    customer.address,
    selectedProductId,
    items.length,
    shippingFee,
    orderDiscount,
    paidAmount,
    draftOrder,
  ]);

  const requestClose = useCallback(() => {
    if (isExitConfirmOpen) return;
    if (!hasFormValues) {
      onClose();
      return;
    }
    setIsExitConfirmOpen(true);
  }, [hasFormValues, isExitConfirmOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      requestClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, requestClose]);

  const handleAddItem = () => {
    if (!selectedProductId) return;
    const selectedProduct = products.find((product) => product.id === selectedProductId);
    if (!selectedProduct) return;

    const newItem: OrderItemDraft = {
      lineId: generateLineId(),
      id: selectedProduct.id,
      name: selectedProduct.name,
      sku: selectedProduct.sku ?? 'N/A',
      serialNumber: generateSerialNumber(),
      quantity: 1,
      warrantyMonths: 0,
      price: selectedProduct.price_vnd,
      productDiscount: 0,
    };

    setItems((prev) => [...prev, newItem]);
    setSelectedProductId('');
  };

  const handleUpdateItem = (lineId: string, patch: Partial<OrderItemDraft>) => {
    setItems((prev) => prev.map((item) => (item.lineId === lineId ? { ...item, ...patch } : item)));
  };

  const handleRemoveItem = (lineId: string) => {
    setItems((prev) => prev.filter((item) => item.lineId !== lineId));
  };

  const handleCurrencyChange = (
    value: string,
    setInput: React.Dispatch<React.SetStateAction<string>>,
    setNumber: React.Dispatch<React.SetStateAction<number>>
  ) => {
    setInput(value);
    setNumber(parseCurrencyInput(value));
  };

  const handleCurrencyBlur = (
    value: string,
    setInput: React.Dispatch<React.SetStateAction<string>>,
    setNumber: React.Dispatch<React.SetStateAction<number>>
  ) => {
    const numericValue = parseCurrencyInput(value);
    setNumber(numericValue);
    setInput(formatCurrencyInput(numericValue));
  };

  const handleCurrencyFocus = (
    value: number,
    setInput: React.Dispatch<React.SetStateAction<string>>
  ) => {
    setInput(String(value));
  };

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );
  const productDiscountTotal = useMemo(
    () => items.reduce((sum, item) => sum + Math.min(item.productDiscount, item.price) * item.quantity, 0),
    [items]
  );
  const finalTotal = useMemo(
    () => Math.max(0, subtotal - productDiscountTotal - orderDiscount + shippingFee),
    [subtotal, productDiscountTotal, orderDiscount, shippingFee]
  );
  const balance = useMemo(() => Math.max(0, finalTotal - paidAmount), [finalTotal, paidAmount]);
  const orderStatus = useMemo(() => resolveOrderStatus(finalTotal, paidAmount), [finalTotal, paidAmount]);

  const handleConfirmInvoice = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');

    if (!customer.phone.trim()) {
      setFormError('Vui lòng nhập số điện thoại khách hàng.');
      return;
    }

    if (!customer.name.trim()) {
      setFormError('Vui lòng nhập tên khách hàng.');
      return;
    }

    if (items.length === 0) {
      setFormError('Vui lòng chọn ít nhất một sản phẩm.');
      return;
    }

    const order: Order = {
      id: generateOrderId(),
      customerSnapshot: {
        phone: customer.phone.trim(),
        name: customer.name.trim(),
        email: customer.email.trim(),
        address: customer.address.trim(),
      },
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        serialNumber: item.serialNumber,
        quantity: item.quantity,
        warrantyMonths: item.warrantyMonths,
        price: item.price,
        productDiscount: item.productDiscount,
      })),
      shippingFee,
      orderDiscount,
      paidAmount,
      totalAmount: finalTotal,
      status: orderStatus,
      createdAt: new Date().toISOString(),
    };

    setDraftOrder(order);
    setStep('preview');
  };

  const handleSendAndSave = async () => {
    if (!draftOrder) return;
    setIsSending(true);
    setSendError('');

    try {
      const response = await fetch('/api/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderSnapshot: draftOrder }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.log('Email send failed', response.status, errorText);
        setSendError('Không thể gửi email hóa đơn.');
        return;
      }

      console.log('Email sent successfully', draftOrder.id);

      try {
        const docRef = await addDoc(collection(db, 'orders'), draftOrder);
        console.log('Firebase save success', docRef.id);
      } catch (error) {
        console.log('Firebase save failed', error);
        setSendError('Không thể lưu đơn hàng.');
        return;
      }

      onCreateOrder(draftOrder);
      onInvoiceSent();
      resetDraft();
      onClose();
    } catch (error) {
      console.log('Email send failed', error);
      setSendError('Không thể gửi email hóa đơn.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  const lookupMessageClass = lookupState.status === 'loading'
    ? 'loading'
    : lookupState.status === 'found'
      ? 'success'
      : lookupState.status === 'not_found' || lookupState.status === 'error'
        ? 'error'
        : '';

  const canConfirm = items.length > 0 && customer.phone.trim().length > 0 && customer.name.trim().length > 0;

  return (
    <>
      <div className="modal-overlay" onClick={requestClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()} ref={modalContentRef}>
          <div className="modal-header">
            <h2><i className="fas fa-plus"></i> Tạo đơn hàng mới</h2>
            <button className="modal-close" onClick={requestClose} aria-label="Đóng">
              <i className="fas fa-times"></i>
            </button>
          </div>

        {step === 'edit' ? (
          <form className="product-form" onSubmit={handleConfirmInvoice}>
            <div className="form-section">
              <h3 className="form-section-title">
                <i className="fas fa-user"></i>
                Thông tin khách hàng
              </h3>

              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="order-phone">Số điện thoại</label>
                  <input
                    id="order-phone"
                    type="tel"
                    value={customer.phone}
                    onChange={(e) => handleCustomerChange('phone', e.target.value)}
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div className="form-group">
                  <label>&nbsp;</label>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleLookup}
                    disabled={normalizedPhone.length < MIN_PHONE_LENGTH || lookupState.status === 'loading'}
                  >
                    {lookupState.status === 'loading' ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Đang tìm...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-search"></i> Tra cứu
                      </>
                    )}
                  </button>
                </div>
              </div>

              {lookupState.status !== 'idle' && lookupMessageClass && (
                <div className={`status-message ${lookupMessageClass}`}>
                  {lookupState.message}
                </div>
              )}

              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="order-name">Họ tên</label>
                  <input
                    id="order-name"
                    type="text"
                    value={customer.name}
                    onChange={(e) => handleCustomerChange('name', e.target.value)}
                    placeholder="Nhập tên khách hàng"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="order-email">Email</label>
                  <input
                    id="order-email"
                    type="email"
                    value={customer.email}
                    onChange={(e) => handleCustomerChange('email', e.target.value)}
                    placeholder="Nhập email"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="order-address">Địa chỉ</label>
                  <input
                    id="order-address"
                    type="text"
                    value={customer.address}
                    onChange={(e) => handleCustomerChange('address', e.target.value)}
                    placeholder="Nhập địa chỉ giao hàng"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">
                <i className="fas fa-boxes-stacked"></i>
                Sản phẩm
              </h3>

              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="order-product">Chọn sản phẩm</label>
                  <select
                    id="order-product"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    disabled={productsLoading}
                  >
                    <option value="">Chọn sản phẩm</option>
                    {sortedProducts.map((product: Product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {formatCurrency(product.price_vnd)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>&nbsp;</label>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleAddItem}
                    disabled={!selectedProductId}
                  >
                    <i className="fas fa-plus"></i> Thêm sản phẩm
                  </button>
                </div>
              </div>

              {productsLoading && (
                <div className="status-message loading">
                  <i className="fas fa-spinner fa-spin"></i> Đang tải sản phẩm...
                </div>
              )}

              {items.length === 0 ? (
                <div className="filter-placeholder">
                  <i className="fas fa-box-open"></i>
                  Chưa có sản phẩm nào được thêm.
                </div>
              ) : (
                <div className="products-management">
                  <div className="products-table-wrapper">
                    <div className="table-container">
                      <table className="products-table order-items-table">
                        <thead>
                          <tr>
                            <th>Sản phẩm</th>
                            <th>Giá</th>
                            <th>Số lượng</th>
                            <th>S/N</th>
                            <th>Bảo hành (tháng)</th>
                            <th>Giảm giá (VND)</th>
                            <th>Hành động</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item) => (
                            <tr key={item.lineId}>
                              <td>
                                <div className="product-name">
                                  <strong>{item.name}</strong>
                                  <span className="product-id">SKU: {item.sku}</span>
                                </div>
                              </td>
                              <td>{formatCurrency(item.price)}</td>
                              <td>
                                <input
                                  type="number"
                                  min="1"
                                  className="product-form-filter-input"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateItem(
                                    item.lineId,
                                    { quantity: Math.max(1, parseNumberInput(e.target.value)) }
                                  )}
                                />
                              </td>
                              <td>
                                <span className="product-id">{item.serialNumber}</span>
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  className="product-form-filter-input"
                                  value={item.warrantyMonths}
                                  onChange={(e) => handleUpdateItem(item.lineId, { warrantyMonths: parseNumberInput(e.target.value) })}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  className="product-form-filter-input"
                                  value={item.productDiscount}
                                  onChange={(e) => handleUpdateItem(item.lineId, { productDiscount: parseNumberInput(e.target.value) })}
                                />
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn-action btn-delete"
                                  onClick={() => handleRemoveItem(item.lineId)}
                                  title="Xóa"
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
                </div>
              )}
            </div>

            <div className="form-section">
              <h3 className="form-section-title">
                <i className="fas fa-file-invoice-dollar"></i>
                Thanh toán
              </h3>

              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="order-shipping">Phí vận chuyển</label>
                  <input
                    id="order-shipping"
                    type="text"
                    inputMode="numeric"
                    value={shippingFeeInput}
                    onChange={(e) => handleCurrencyChange(e.target.value, setShippingFeeInput, setShippingFee)}
                    onBlur={(e) => handleCurrencyBlur(e.target.value, setShippingFeeInput, setShippingFee)}
                    onFocus={() => handleCurrencyFocus(shippingFee, setShippingFeeInput)}
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="order-discount">Giảm giá đơn hàng</label>
                  <input
                    id="order-discount"
                    type="text"
                    inputMode="numeric"
                    value={orderDiscountInput}
                    onChange={(e) => handleCurrencyChange(e.target.value, setOrderDiscountInput, setOrderDiscount)}
                    onBlur={(e) => handleCurrencyBlur(e.target.value, setOrderDiscountInput, setOrderDiscount)}
                    onFocus={() => handleCurrencyFocus(orderDiscount, setOrderDiscountInput)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="order-paid">Đã thanh toán</label>
                  <input
                    id="order-paid"
                    type="text"
                    inputMode="numeric"
                    value={paidAmountInput}
                    onChange={(e) => handleCurrencyChange(e.target.value, setPaidAmountInput, setPaidAmount)}
                    onBlur={(e) => handleCurrencyBlur(e.target.value, setPaidAmountInput, setPaidAmount)}
                    onFocus={() => handleCurrencyFocus(paidAmount, setPaidAmountInput)}
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="order-balance">Còn lại</label>
                  <input
                    id="order-balance"
                    type="text"
                    value={formatCurrency(balance)}
                    disabled
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="order-subtotal">Tạm tính</label>
                  <input
                    id="order-subtotal"
                    type="text"
                    value={formatCurrency(subtotal)}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="order-product-discount">Giảm giá sản phẩm</label>
                  <input
                    id="order-product-discount"
                    type="text"
                    value={formatCurrency(productDiscountTotal)}
                    disabled
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="order-total">Tổng cộng</label>
                  <input
                    id="order-total"
                    type="text"
                    value={formatCurrency(finalTotal)}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="order-status">Trạng thái</label>
                  <input
                    id="order-status"
                    type="text"
                    value={ORDER_STATUS_CONFIG[orderStatus].label}
                    disabled
                  />
                </div>
              </div>
            </div>

            {formError && (
              <div className="status-message error">{formError}</div>
            )}

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={requestClose}>
                Hủy
              </button>
              <button type="submit" className="btn-primary" disabled={!canConfirm}>
                <i className="fas fa-file-invoice"></i> Xác nhận hóa đơn
              </button>
            </div>
          </form>
        ) : (
          <div className="product-form">
            {draftOrder ? (
              <InvoicePreview order={draftOrder} />
            ) : (
              <div className="filter-placeholder">
                <i className="fas fa-file"></i>
                Chưa có dữ liệu hóa đơn.
              </div>
            )}

            {sendError && (
              <div className="status-message error">{sendError}</div>
            )}

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setStep('edit')}>
                Quay lại
              </button>
              <button type="button" className="btn-primary" onClick={handleSendAndSave} disabled={isSending}>
                {isSending ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Đang gửi...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i> Gửi & Lưu Hóa Đơn
                  </>
                )}
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
      <ConfirmationModal
        isOpen={isExitConfirmOpen}
        title="Thoát tạo đơn?"
        message="Bạn có chắc muốn thoát? Dữ liệu đang nhập sẽ bị mất."
        warningText="Các thay đổi chưa được lưu."
        icon="warning"
        primaryButtonLabel="Thoát"
        secondaryButtonLabel="Ở lại"
        onPrimaryAction={() => {
          setIsExitConfirmOpen(false);
          onClose();
        }}
        onSecondaryAction={() => setIsExitConfirmOpen(false)}
        onClose={() => setIsExitConfirmOpen(false)}
      />
    </>
  );
};

const OrderDetailModal: React.FC<ModalProps> = ({ isOpen, onClose, order }) => {
  const [isSending, setIsSending] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [sendError, setSendError] = useState('');

  const subtotal = useMemo(() => {
    if (!order) return 0;
    return order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [order]);

  const discountTotal = useMemo(() => {
    if (!order) return 0;
    const productDiscounts = order.items.reduce(
      (sum, item) => sum + Math.min(item.productDiscount, item.price) * item.quantity,
      0
    );
    return productDiscounts + order.orderDiscount;
  }, [order]);

  const balance = useMemo(() => {
    if (!order) return 0;
    return Math.max(0, order.totalAmount - order.paidAmount);
  }, [order]);

  const handleSendEmail = async () => {
    if (!order) return;
    setIsSending(true);
    setSendError('');

    try {
      await sendInvoiceEmail(order);
      setShowToast(true);
    } catch {
      setSendError('Không thể gửi email hóa đơn.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen || !order) return null;

  const statusConfig = ORDER_STATUS_CONFIG[order.status];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2><i className="fas fa-receipt"></i> Chi tiết đơn hàng</h2>
          <button className="modal-close" onClick={onClose} aria-label="Đóng">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="product-form">
          <div className="form-section">
            <h3 className="form-section-title">
              <i className="fas fa-file-invoice"></i>
              Thông tin đơn hàng
            </h3>
            <div className="form-row-2">
              <div className="form-group">
                <label>Mã đơn</label>
                <input type="text" value={order.id} readOnly />
              </div>
              <div className="form-group">
                <label>Ngày tạo</label>
                <input type="text" value={formatDateTime(order.createdAt)} readOnly />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Trạng thái</label>
                <span className={`status-badge ${statusConfig.className}`}>
                  <i className={`fas ${statusConfig.icon}`}></i> {statusConfig.label}
                </span>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">
              <i className="fas fa-user"></i>
              Thông tin khách hàng
            </h3>
            <div className="form-row-2">
              <div className="form-group">
                <label>Họ tên</label>
                <input type="text" value={order.customerSnapshot.name} readOnly />
              </div>
              <div className="form-group">
                <label>Số điện thoại</label>
                <input type="text" value={order.customerSnapshot.phone} readOnly />
              </div>
            </div>
            <div className="form-row-2">
              <div className="form-group">
                <label>Email</label>
                <input type="text" value={order.customerSnapshot.email || '—'} readOnly />
              </div>
              <div className="form-group">
                <label>Địa chỉ</label>
                <input type="text" value={order.customerSnapshot.address || '—'} readOnly />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">
              <i className="fas fa-boxes-stacked"></i>
              Sản phẩm
            </h3>
            <div className="products-table-wrapper orders-table-scroll">
              <div className="table-container">
                <table className="products-table">
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>S/N</th>
                      <th>Bảo hành</th>
                      <th>Giá</th>
                      <th>Số lượng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.serialNumber}>
                        <td>
                          <div className="product-name">
                            <strong>{item.name}</strong>
                            <span className="product-id">SKU: {item.sku}</span>
                          </div>
                        </td>
                        <td>
                          <span className="product-id">{item.serialNumber}</span>
                        </td>
                        <td>{item.warrantyMonths} tháng</td>
                        <td>{formatCurrency(item.price)}</td>
                        <td>{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">
              <i className="fas fa-calculator"></i>
              Tổng kết
            </h3>
            <div className="form-row-2">
              <div className="form-group">
                <label>Tạm tính</label>
                <input type="text" value={formatCurrency(subtotal)} readOnly />
              </div>
              <div className="form-group">
                <label>Phí vận chuyển</label>
                <input type="text" value={formatCurrency(order.shippingFee)} readOnly />
              </div>
            </div>
            <div className="form-row-2">
              <div className="form-group">
                <label>Giảm giá</label>
                <input type="text" value={formatCurrency(discountTotal)} readOnly />
              </div>
              <div className="form-group">
                <label>Tổng cộng</label>
                <input type="text" value={formatCurrency(order.totalAmount)} readOnly />
              </div>
            </div>
            <div className="form-row-2">
              <div className="form-group">
                <label>Đã thanh toán</label>
                <input type="text" value={formatCurrency(order.paidAmount)} readOnly />
              </div>
              <div className="form-group">
                <label>Còn lại</label>
                <input type="text" value={formatCurrency(balance)} readOnly />
              </div>
            </div>
          </div>

          {sendError && (
            <div className="status-message error">{sendError}</div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Đóng
            </button>
            <button type="button" className="btn-primary" onClick={handleSendEmail} disabled={isSending}>
              {isSending ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Đang gửi...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i> Gửi Lại Hóa Đơn
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {showToast && (
        <Toast
          message="Đã gửi hóa đơn qua email."
          type="success"
          duration={3000}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
};

const CustomerHistoryModal: React.FC<CustomerHistoryModalProps> = ({
  isOpen,
  onClose,
  customer,
  orders,
  onSelectOrder,
}) => {
  const customerPhone = customer?.phone ?? '';
  const historyOrders = useMemo(() => {
    if (!customerPhone) return [];
    const normalizedPhone = normalizePhone(customerPhone);
    return orders
      .filter((order) => normalizePhone(order.customerSnapshot.phone) === normalizedPhone)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, customerPhone]);

  const totalSpent = useMemo(
    () => historyOrders.reduce((sum, order) => sum + order.totalAmount, 0),
    [historyOrders]
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2><i className="fas fa-user-clock"></i> Lịch sử mua hàng</h2>
          <button className="modal-close" onClick={onClose} aria-label="Đóng">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="product-form">
          <div className="form-section">
            <h3 className="form-section-title">
              <i className="fas fa-id-card"></i>
              Hồ sơ khách hàng
            </h3>
            <div className="form-row-2">
              <div className="form-group">
                <label>Khách hàng</label>
                <input type="text" value={customer?.name ?? '—'} readOnly />
              </div>
              <div className="form-group">
                <label>Số điện thoại</label>
                <input type="text" value={customerPhone || '—'} readOnly />
              </div>
            </div>
            <div className="form-row-2">
              <div className="form-group">
                <label>Tổng đơn</label>
                <input type="text" value={historyOrders.length.toString()} readOnly />
              </div>
              <div className="form-group">
                <label>Tổng chi tiêu</label>
                <input type="text" value={formatCurrency(totalSpent)} readOnly />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">
              <i className="fas fa-receipt"></i>
              Đơn hàng theo khách
            </h3>

            {historyOrders.length === 0 ? (
              <div className="filter-placeholder">
                <i className="fas fa-box-open"></i>
                Chưa có đơn hàng nào.
              </div>
            ) : (
              <div className="products-table-wrapper">
                <div className="table-container">
                  <table className="products-table">
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Ngày tạo</th>
                        <th>Tổng tiền</th>
                        <th>Đã thanh toán</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyOrders.map((order) => {
                        const statusConfig = ORDER_STATUS_CONFIG[order.status];
                        return (
                          <tr
                            key={order.id}
                            onClick={() => onSelectOrder(order)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                onSelectOrder(order);
                              }
                            }}
                          >
                            <td>
                              <div className="product-name">
                                <strong>{order.id}</strong>
                                <span className="product-id">{getItemsSummary(order.items)}</span>
                              </div>
                            </td>
                            <td>{formatDateTime(order.createdAt)}</td>
                            <td>{formatCurrency(order.totalAmount)}</td>
                            <td>{formatCurrency(order.paidAmount)}</td>
                            <td>
                              <span className={`status-badge ${statusConfig.className}`}>
                                <i className={`fas ${statusConfig.icon}`}></i> {statusConfig.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const OrderManagement: React.FC = () => {
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [activeCustomer, setActiveCustomer] = useState<CustomerSummary | null>(null);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);
  const [isCustomerHistoryOpen, setIsCustomerHistoryOpen] = useState(false);
  const [showInvoiceToast, setShowInvoiceToast] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'customers'>('orders');

  const loadOrders = useCallback(async () => {
    try {
      const snapshot = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
      const fetchedOrders: Order[] = snapshot.docs.map((doc) => {
        const data = doc.data() as Partial<Order>;
        const items = Array.isArray(data.items)
          ? data.items.map((item) => {
            const typedItem = item as Partial<ProductSnapshot>;
            return {
              id: typedItem.id ?? '',
              name: typedItem.name ?? 'N/A',
              sku: typedItem.sku ?? 'N/A',
              serialNumber: typedItem.serialNumber ?? doc.id,
              quantity: typedItem.quantity ?? 1,
              warrantyMonths: typedItem.warrantyMonths ?? 0,
              price: typedItem.price ?? 0,
              productDiscount: typedItem.productDiscount ?? 0,
            };
          })
          : [];

        const totalAmount = data.totalAmount ?? 0;
        const paidAmount = data.paidAmount ?? 0;

        return {
          id: data.id ?? doc.id,
          customerSnapshot: data.customerSnapshot ?? {
            phone: '',
            name: '',
            email: '',
            address: '',
          },
          items,
          shippingFee: data.shippingFee ?? 0,
          orderDiscount: data.orderDiscount ?? 0,
          paidAmount,
          totalAmount,
          status: data.status ?? resolveOrderStatus(totalAmount, paidAmount),
          createdAt: data.createdAt ?? new Date().toISOString(),
        };
      });

      setOrders(fetchedOrders);
    } catch (error) {
      console.log('Fetch orders failed', error);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    const query = orderSearchQuery.trim().toLowerCase();
    if (!query) return orders;

    return orders.filter((order) => {
      return order.id.toLowerCase().includes(query);
    });
  }, [orderSearchQuery, orders]);

  const customers = useMemo(() => {
    const customerMap = new Map<string, { customer: CustomerSummary; lastOrderAt: number }>();

    orders.forEach((order) => {
      const normalizedPhone = normalizePhone(order.customerSnapshot.phone);
      if (!normalizedPhone) return;

      const orderTime = new Date(order.createdAt).getTime();
      const current = customerMap.get(normalizedPhone);

      if (!current || orderTime > current.lastOrderAt) {
        customerMap.set(normalizedPhone, {
          customer: {
            phone: order.customerSnapshot.phone,
            name: order.customerSnapshot.name,
          },
          lastOrderAt: orderTime,
        });
      }
    });

    return Array.from(customerMap.values())
      .sort((a, b) => b.lastOrderAt - a.lastOrderAt)
      .map((entry) => entry.customer);
  }, [orders]);

  const filteredCustomers = useMemo(() => {
    const query = customerSearchQuery.trim().toLowerCase();
    if (!query) return customers;

    const normalizedQuery = normalizePhone(query);

    return customers.filter((customer) => {
      const matchesName = customer.name.toLowerCase().includes(query);
      const matchesPhone = normalizedQuery.length > 0
        && normalizePhone(customer.phone).includes(normalizedQuery);
      return matchesName || matchesPhone;
    });
  }, [customers, customerSearchQuery]);

  const handleOpenOrderDetail = (order: Order) => {
    setActiveOrder(order);
    setIsOrderDetailOpen(true);
  };

  const handleOpenCustomerHistory = (customer: CustomerSummary) => {
    setActiveCustomer(customer);
    setIsCustomerHistoryOpen(true);
  };

  const handleCloseOrderDetail = () => {
    setIsOrderDetailOpen(false);
    setActiveOrder(null);
  };

  const handleCloseCustomerHistory = () => {
    setIsCustomerHistoryOpen(false);
    setActiveCustomer(null);
  };

  const handleSelectHistoryOrder = (order: Order) => {
    setActiveOrder(order);
    setIsCustomerHistoryOpen(false);
    setActiveCustomer(null);
    setIsOrderDetailOpen(true);
  };

  const handleCreateOrder = (order: Order) => {
    setOrders((prev) => [order, ...prev]);
  };

  const pageTitle = activeTab === 'orders' ? 'Quản lý hóa đơn' : 'Quản lý khách hàng';
  const pageIcon = activeTab === 'orders' ? 'fa-clipboard-list' : 'fa-users';
  const searchPlaceholder = activeTab === 'orders'
    ? 'Tìm theo mã hóa đơn'
    : 'Tìm theo số điện thoại';

  return (
    <div className="products-management">
      <div className="tab-container">
        <button
          type="button"
          className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
          aria-pressed={activeTab === 'orders'}
        >
          Quản lý hóa đơn
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveTab('customers')}
          aria-pressed={activeTab === 'customers'}
        >
          Quản lý khách hàng
        </button>
      </div>

      <div className="page-header">
        <h2><i className={`fas ${pageIcon}`}></i> {pageTitle}</h2>
        <div className="search-wrapper">
          <i className="fas fa-search"></i>
          <input
            type="text"
            className="search-input"
            placeholder={searchPlaceholder}
            value={activeTab === 'orders' ? orderSearchQuery : customerSearchQuery}
            onChange={(e) => {
              if (activeTab === 'orders') {
                setOrderSearchQuery(e.target.value);
              } else {
                setCustomerSearchQuery(e.target.value);
              }
            }}
          />
        </div>
        {activeTab === 'orders' && (
          <button className="btn-primary" onClick={() => setIsCreateOrderOpen(true)}>
            <i className="fas fa-plus"></i>
            <span>Tạo đơn hàng mới</span>
          </button>
        )}
      </div>

      <div className="tab-panel" key={activeTab}>
        {activeTab === 'orders' ? (
          <>
            <div className="products-table-wrapper orders-table-scroll">
              {filteredOrders.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-receipt"></i>
                  <p>Không tìm thấy đơn hàng nào.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="products-table">
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Khách hàng</th>
                        <th>Sản phẩm</th>
                        <th>Tổng tiền</th>
                        <th>Đã thanh toán</th>
                        <th>Trạng thái</th>
                        <th>Ngày tạo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => {
                        const statusConfig = ORDER_STATUS_CONFIG[order.status];
                        return (
                          <tr
                            key={order.id}
                            onClick={() => handleOpenOrderDetail(order)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                handleOpenOrderDetail(order);
                              }
                            }}
                          >
                            <td>
                              <div className="product-name">
                                <strong>{order.id}</strong>
                              </div>
                            </td>
                            <td>
                              <div className="product-name">
                                <strong>{order.customerSnapshot.name}</strong>
                                <span className="product-id">SĐT: {order.customerSnapshot.phone}</span>
                                <span className="product-id">{order.customerSnapshot.email}</span>
                              </div>
                            </td>
                            <td>
                              <div className="product-name">
                                <strong>{getItemsSummary(order.items)}</strong>
                                <span className="product-id">{order.items.length} sản phẩm</span>
                              </div>
                            </td>
                            <td>{formatCurrency(order.totalAmount)}</td>
                            <td>{formatCurrency(order.paidAmount)}</td>
                            <td>
                              <span className={`status-badge ${statusConfig.className}`}>
                                <i className={`fas ${statusConfig.icon}`}></i> {statusConfig.label}
                              </span>
                            </td>
                            <td>{formatDateTime(order.createdAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="table-footer">
              <p>Hiển thị {filteredOrders.length} / {orders.length} đơn hàng</p>
            </div>
          </>
        ) : (
          <>
            <div className="products-table-wrapper customers-table-scroll">
              {filteredCustomers.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-users"></i>
                  <p>Không tìm thấy khách hàng nào.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="products-table">
                    <thead>
                      <tr>
                        <th>Số điện thoại</th>
                        <th>Khách hàng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.map((customer) => (
                        <tr
                          key={customer.phone}
                          onClick={() => handleOpenCustomerHistory(customer)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              handleOpenCustomerHistory(customer);
                            }
                          }}
                        >
                          <td>
                            <div className="product-name">
                              <strong>{customer.phone}</strong>
                              <span className="product-id">ID khách hàng</span>
                            </div>
                          </td>
                          <td>{customer.name || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="table-footer">
              <p>Hiển thị {filteredCustomers.length} / {customers.length} khách hàng</p>
            </div>
          </>
        )}
      </div>

      <CreateOrderModal
        isOpen={isCreateOrderOpen}
        onClose={() => setIsCreateOrderOpen(false)}
        onCreateOrder={handleCreateOrder}
        onInvoiceSent={() => setShowInvoiceToast(true)}
      />
      <OrderDetailModal isOpen={isOrderDetailOpen} onClose={handleCloseOrderDetail} order={activeOrder} />
      <CustomerHistoryModal
        isOpen={isCustomerHistoryOpen}
        onClose={handleCloseCustomerHistory}
        customer={activeCustomer}
        orders={orders}
        onSelectOrder={handleSelectHistoryOrder}
      />
      {showInvoiceToast && (
        <Toast
          message="Đã gửi hóa đơn qua email."
          type="success"
          duration={3000}
          onClose={() => setShowInvoiceToast(false)}
        />
      )}
    </div>
  );
};

export default OrderManagement;