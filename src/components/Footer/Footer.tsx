import React from 'react';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import './Footer.css';

const Footer: React.FC = () => {
  const { showButton, scrollToTop } = useScrollToTop();
  
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Footer Top */}
        <div className="footer-top">
          {/* Brand Section */}
          <div className="footer-brand">
            <div className="footer-logo">
              <i className="fas fa-gamepad"></i>
              <span>USide Shop</span>
            </div>
            <p className="footer-description">
              Cửa hàng gaming gear và digital products. 
              Chất lượng cao, giá cả hợp lý, dịch vụ tận tâm.
            </p>
            <div className="footer-social">
              <a href={`https://zalo.me/${import.meta.env.VITE_ZALO_PHONE}`} className="social-link facebook" target="_blank" rel="noopener noreferrer">
                <i className="fas fa-comments"></i>
              </a>

              <a href="#" className="social-link youtube">
                <i className="fab fa-youtube"></i>
              </a>
              <a href="#" className="social-link instagram">
                <i className="fab fa-instagram"></i>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h3 className="footer-title">
              <i className="fas fa-link"></i>
              Liên Kết Nhanh
            </h3>
            <ul className="footer-links">
              <li><a href="/"><i className="fa-solid fa-arrow-right"></i>Trang Chủ</a></li>
              <li><a href="/products"><i className="fa-solid fa-arrow-right"></i>Sản Phẩm</a></li>
              <li><a href="/products?category=digital"><i className="fa-solid fa-arrow-right"></i> Digital Products</a></li>
              <li><a href="/wishlist"><i className="fa-solid fa-arrow-right"></i>Yêu Thích</a></li>
              <li><a href="/contact"><i className="fa-solid fa-arrow-right"></i>Liên Hệ</a></li>
            </ul>
          </div>

          {/* Product Categories */}
          <div className="footer-section">
            <h3 className="footer-title">
              <i className="fas fa-th-large"></i>
              Danh Mục
            </h3>
            <ul className="footer-links">
              <li><a href="/products?category=keyboard"><i className="fa-solid fa-arrow-right"></i> Bàn Phím </a></li>
              <li><a href="/products?category=mouse"><i className="fa-solid fa-arrow-right"></i> Chuột </a></li>
              <li><a href="/products?category=headset"><i className="fa-solid fa-arrow-right"></i> Tai Nghe </a></li>
              <li><a href="/products?category=monitor"><i className="fa-solid fa-arrow-right"></i> Màn Hình </a></li>
              <li><a href="/products?category=usb"><i className="fa-solid fa-arrow-right"></i> Phụ Kiện USB</a></li>
              <li><a href="/products?category=other"><i className="fa-solid fa-arrow-right"></i> Sản Phẩm Khác</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-section">
            <h3 className="footer-title">
              <i className="fas fa-info-circle"></i>
              Thông Tin Liên Hệ
            </h3>
            <div className="footer-contact">
              <div className="contact-item">
                <i className="fas fa-comments"></i>
                <div>
                  <span className="contact-label">Zalo</span>
                  <span className="contact-value">Hân Nguyễn</span>
                </div>
              </div>

              <div className="contact-item">
                <i className="fas fa-clock"></i>
                <div>
                  <span className="contact-label">Giờ Hoạt Động</span>
                  <span className="contact-value">24/7 Online</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <p>&copy; 2025 USide Shop. Tất cả quyền được bảo lưu.</p>
            <div className="footer-legal">
              <a href="#" className="legal-link">Điều Khoản Sử Dụng</a>
              <span className="separator">•</span>
              <a href="#" className="legal-link">Chính Sách Bảo Mật</a>
              <span className="separator">•</span>
              <a href="#" className="legal-link">Chính Sách Đổi Trả</a>
            </div>
          </div>
          <div className="footer-bottom-right">
            <div className="payment-methods">
              <span className="payment-label">Thanh toán:</span>
              <div className="payment-icons">
                <i className="fas fa-money-bill-wave" title="VND Cash"></i>
  
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to top button */}
      {showButton && (
        <div className="scroll-to-top" onClick={scrollToTop}>
          <i className="fas fa-arrow-up"></i>
        </div>
      )}
    </footer>
  );
};

export default Footer;