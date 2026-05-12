import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

export type InvoiceEmailItem = {
  id: string;
  name: string;
  sku?: string;
  serialNumber: string;
  warrantyMonths: number;
  price: number;
  quantity: number;
  productDiscount: number;
};

export type InvoiceEmailOrder = {
  id: string;
  createdAt: string;
  customerSnapshot: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
  };
  items: InvoiceEmailItem[];
  shippingFee: number;
  orderDiscount: number;
  paidAmount: number;
  totalAmount: number;
};

export type InvoiceEmailTemplateProps = {
  order: InvoiceEmailOrder;
};

const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')} đ`;

const InvoiceEmailTemplate: React.FC<InvoiceEmailTemplateProps> = ({ order }) => {
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const productDiscount = order.items.reduce(
    (sum, item) => sum + Math.min(item.productDiscount, item.price) * item.quantity,
    0
  );
  const totalDiscount = productDiscount + order.orderDiscount;
  const total = order.totalAmount;
  const paid = order.paidAmount;
  const balance = Math.max(0, total - paid);
  const statusLabel = total <= 0
    ? 'ĐÃ THANH TOÁN'
    : paid <= 0
      ? 'CHƯA THANH TOÁN'
      : paid >= total
        ? 'ĐÃ THANH TOÁN'
        : 'THANH TOÁN MỘT PHẦN';

  return (
    <Html>
      <Head />
      <Preview>Xác nhận đơn hàng {order.id} - Uside Shop</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Text style={brand}>USIDE SHOP</Text>
            <Text style={brandSub}>PROFESSIONAL GAMING GEARS</Text>
          </Section>

          <Section style={titleSection}>
            <Heading style={title}>XÁC NHẬN ĐƠN HÀNG #{order.id}</Heading>
            <Text style={introText}>
              Chào {order.customerSnapshot.name || 'bạn'}, cảm ơn bạn đã mua sắm tại Uside Shop.
              Dưới đây là hóa đơn chi tiết cho giao dịch của bạn.
            </Text>
          </Section>

          <Section style={infoSection}>
            <table style={infoTable} cellPadding={0} cellSpacing={0}>
              <tbody>
                <tr>
                  <td style={infoCellLeft}>
                    <table style={infoCard} cellPadding={0} cellSpacing={0}>
                      <tbody>
                        <tr>
                          <td style={infoCardBody}>
                            <Text style={cardTitle}>KHÁCH HÀNG</Text>
                            <Text style={cardTextStrong}>{order.customerSnapshot.name || 'N/A'}</Text>
                            <Text style={cardText}>SĐT: {order.customerSnapshot.phone || 'N/A'}</Text>
                            <Text style={cardText}>Email: {order.customerSnapshot.email || 'N/A'}</Text>
                            <Text style={cardText}>Địa chỉ: {order.customerSnapshot.address || 'N/A'}</Text>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                  <td style={infoCellRight}>
                    <table style={infoCard} cellPadding={0} cellSpacing={0}>
                      <tbody>
                        <tr>
                          <td style={infoCardBody}>
                            <Text style={cardTitle}>ĐƠN HÀNG</Text>
                            <Text style={cardText}>Ngày: {new Date(order.createdAt).toLocaleDateString('vi-VN')}</Text>
                            <Text style={cardText}>Mã đơn: {order.id}</Text>
                            <Text style={statusBadge}>{statusLabel}</Text>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Section style={infoSection}>
            <Text style={sectionTitle}>CHI TIẾT SẢN PHẨM</Text>
            <table style={table}>
              <thead>
                <tr>
                  <th style={thLeft}>Sản phẩm</th>
                  <th style={thCenter}>S/N</th>
                  <th style={thCenter}>Bảo hành</th>
                  <th style={thRight}>Giá</th>
                  <th style={thCenter}>SL</th>
                  <th style={thRight}>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.serialNumber}>
                    <td style={tdLeft}>
                      <Text style={itemName}>{item.name}</Text>
                      <Text style={itemSub}>SKU: {item.sku || 'N/A'}</Text>
                    </td>
                    <td style={tdCenter}>{item.serialNumber}</td>
                    <td style={tdCenter}>{item.warrantyMonths} tháng</td>
                    <td style={tdRight}>{formatCurrency(item.price)}</td>
                    <td style={tdCenter}>{item.quantity}</td>
                    <td style={tdRight}>{formatCurrency(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section style={summarySection}>
            <table style={summaryTable}>
              <tbody>
                <tr>
                  <td style={summaryLabel}>Tạm tính</td>
                  <td style={summaryValue}>{formatCurrency(subtotal)}</td>
                </tr>
                <tr>
                  <td style={summaryLabel}>Phí vận chuyển</td>
                  <td style={summaryValue}>{formatCurrency(order.shippingFee)}</td>
                </tr>
                <tr>
                  <td style={summaryLabel}>Giảm giá</td>
                  <td style={summaryValue}>{formatCurrency(totalDiscount)}</td>
                </tr>
                <tr>
                  <td style={summaryLabelStrong}>TỔNG CỘNG</td>
                  <td style={summaryValueStrong}>{formatCurrency(total)}</td>
                </tr>
              </tbody>
            </table>

            <div style={summaryDivider} />

            <table style={summaryTable}>
              <tbody>
                <tr>
                  <td style={summaryLabel}>Đã thanh toán</td>
                  <td style={summaryValue}>{formatCurrency(paid)}</td>
                </tr>
                <tr>
                  <td style={summaryLabelHighlight}>SỐ TIỀN CÒN LẠI</td>
                  <td style={summaryValueHighlight}>{formatCurrency(balance)}</td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Section style={notesSection}>
            <Text style={notesTitle}>LƯU Ý</Text>
            <Text style={notesItem}>• Bảo hành theo số serial trên sản phẩm.</Text>
            <Text style={notesItem}>• Vui lòng giữ lại hóa đơn để đối soát khi cần.</Text>
            <Text style={notesItem}>• Vui lòng quay video mở hàng để được hỗ trợ đổi/hoàn khi có sự cố do vận chuyển.</Text>
            <Text style={notesItem}>• Liên hệ Uside Shop nếu cần hỗ trợ thêm.</Text>
          </Section>

          <Hr style={divider} />
          <Text style={footerText}>Uside Shop - Professional Gaming Gears</Text>
        </Container>
      </Body>
    </Html>
  );
};

export default InvoiceEmailTemplate;

const main = {
  backgroundColor: '#f4f6fb',
  fontFamily: 'Arial, Helvetica, sans-serif',
  padding: '24px',
};

const container = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '24px',
  color: '#0f172a',
  border: '1px solid #e2e8f0',
  width: '100%',
  maxWidth: '760px',
  margin: '0 auto',
};

const headerSection = {
  textAlign: 'center' as const,
  padding: '16px 0 8px',
  borderBottom: '2px solid #e2e8f0',
};

const brand = {
  fontSize: '18px',
  letterSpacing: '0.3em',
  textTransform: 'uppercase' as const,
  color: '#0f172a',
  margin: '0',
  fontWeight: 700,
};

const brandSub = {
  fontSize: '11px',
  letterSpacing: '0.2em',
  textTransform: 'uppercase' as const,
  color: '#64748b',
  margin: '6px 0 0',
};

const title = {
  fontSize: '20px',
  margin: '0 0 8px',
  color: '#0f172a',
  fontWeight: 700,
};

const titleSection = {
  marginTop: '16px',
  marginBottom: '16px',
};

const introText = {
  fontSize: '13px',
  color: '#475569',
  margin: 0,
  lineHeight: '1.6',
};

const infoSection = {
  marginBottom: '18px',
};

const sectionTitle = {
  fontSize: '13px',
  fontWeight: 700,
  marginBottom: '8px',
  color: '#0f172a',
  letterSpacing: '0.08em',
};

const infoTable = {
  width: '100%',
  borderCollapse: 'separate' as const,
};

const infoCellLeft = {
  width: '50%',
  paddingRight: '8px',
  verticalAlign: 'top' as const,
};

const infoCellRight = {
  width: '50%',
  paddingLeft: '8px',
  verticalAlign: 'top' as const,
};

const infoCard = {
  width: '100%',
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '10px',
};

const infoCardBody = {
  padding: '12px 16px',
};

const cardTitle = {
  fontSize: '11px',
  color: '#64748b',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  margin: '0 0 6px',
};

const cardTextStrong = {
  fontSize: '14px',
  fontWeight: 700,
  margin: '0 0 6px',
  color: '#0f172a',
};

const cardText = {
  fontSize: '12px',
  margin: '4px 0',
  color: '#475569',
};

const statusBadge = {
  display: 'inline-block',
  padding: '4px 10px',
  borderRadius: '999px',
  backgroundColor: '#fef3c7',
  color: '#92400e',
  fontSize: '11px',
  fontWeight: 700,
  marginTop: '6px',
};

const table = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  marginTop: '8px',
};

const thLeft = {
  textAlign: 'left' as const,
  fontSize: '11px',
  color: '#64748b',
  padding: '8px 6px',
  borderBottom: '1px solid #e2e8f0',
  backgroundColor: '#f8fafc',
};

const thCenter = {
  textAlign: 'center' as const,
  fontSize: '11px',
  color: '#64748b',
  padding: '8px 6px',
  borderBottom: '1px solid #e2e8f0',
  backgroundColor: '#f8fafc',
};

const thRight = {
  textAlign: 'right' as const,
  fontSize: '11px',
  color: '#64748b',
  padding: '8px 6px',
  borderBottom: '1px solid #e2e8f0',
  backgroundColor: '#f8fafc',
};

const tdLeft = {
  fontSize: '12px',
  color: '#0f172a',
  padding: '10px 6px',
  borderBottom: '1px solid #e2e8f0',
  verticalAlign: 'top' as const,
};

const tdCenter = {
  fontSize: '12px',
  color: '#0f172a',
  padding: '10px 6px',
  borderBottom: '1px solid #e2e8f0',
  textAlign: 'center' as const,
  verticalAlign: 'top' as const,
};

const tdRight = {
  fontSize: '12px',
  color: '#0f172a',
  padding: '10px 6px',
  borderBottom: '1px solid #e2e8f0',
  textAlign: 'right' as const,
  verticalAlign: 'top' as const,
};

const itemName = {
  margin: '0 0 4px',
  fontWeight: 600,
  color: '#0f172a',
};

const itemSub = {
  margin: 0,
  fontSize: '10px',
  color: '#64748b',
};

const summarySection = {
  marginTop: '12px',
  marginBottom: '16px',
  border: '1px solid #e2e8f0',
  borderRadius: '10px',
  padding: '12px 16px',
  backgroundColor: '#f8fafc',
};

const summaryTable = {
  width: '100%',
  marginTop: '4px',
};

const summaryDivider = {
  height: '1px',
  backgroundColor: '#e2e8f0',
  margin: '8px 0',
};

const summaryLabel = {
  fontSize: '12px',
  color: '#475569',
  padding: '6px 0',
};

const summaryValue = {
  fontSize: '12px',
  color: '#0f172a',
  padding: '6px 0',
  textAlign: 'right' as const,
};

const summaryLabelStrong = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#0f172a',
  padding: '8px 0',
};

const summaryValueStrong = {
  fontSize: '13px',
  fontWeight: 700,
  color: '#0f172a',
  padding: '8px 0',
  textAlign: 'right' as const,
};

const summaryLabelHighlight = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#0f172a',
  padding: '8px 0',
};

const summaryValueHighlight = {
  fontSize: '13px',
  fontWeight: 700,
  color: '#0f172a',
  padding: '8px 0',
  textAlign: 'right' as const,
};

const divider = {
  borderColor: '#e2e8f0',
  margin: '20px 0 12px',
};

const notesSection = {
  marginTop: '8px',
  marginBottom: '8px',
};

const notesTitle = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#0f172a',
  margin: '0 0 6px',
};

const notesItem = {
  fontSize: '11px',
  color: '#475569',
  margin: '4px 0',
};

const footerText = {
  textAlign: 'center' as const,
  fontSize: '11px',
  color: '#64748b',
  margin: 0,
};
