import React from 'react';
import logo from '../../assets/logo.png';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer footer--mini">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="footer-logo">
            <img src={logo} alt="Fbox Shop" className="footer-logo-image" />
            <span>Fbox Shop</span>
          </div>
          <p className="footer-description">
            Cửa hàng gaming gear.{/* ẩn digital: và digital products. */}
            Chất lượng cao, giá cả hợp lý.
          </p>
          <div className="footer-social">
            <a
              href={`https://zalo.me/${import.meta.env.VITE_ZALO_PHONE}`}
              className="social-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fas fa-comments"></i>
            </a>
            <a href="#" className="social-link">
              <i className="fab fa-youtube"></i>
            </a>
            <a href="#" className="social-link">
              <i className="fab fa-instagram"></i>
            </a>
          </div>
        </div>

        <nav className="footer-links">
          <div className="footer-links-title">Liên Kết</div>
          <a href="/"><i className="fa-solid fa-arrow-right"></i>Trang Chủ</a>
          <a href="/products"><i className="fa-solid fa-arrow-right"></i>Sản Phẩm</a>
          <a href="/wishlist"><i className="fa-solid fa-arrow-right"></i>Yêu Thích</a>
          <a href="/contact"><i className="fa-solid fa-arrow-right"></i>Liên Hệ</a>
        </nav>

        <div className="footer-meta">
          <div className="footer-legal">
            <span>&copy; 2025 Fbox Shop</span>
            <a href="#">Điều Khoản</a>
            <a href="#">Bảo Mật</a>
            <a href="#">Đổi Trả</a>
          </div>
          <div className="footer-payments">
            <span>Thanh toán:</span>
            <i className="fas fa-money-bill-wave" title="VND Cash"></i>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;