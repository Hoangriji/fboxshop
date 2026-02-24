import React from 'react';
import Button from '../../components/Button/Button';
import { openZaloImmediate } from '../../utils/zaloHelper';
import './ContactPage.css';

const ContactPage: React.FC = () => {
  return (
    <div className="contact-page">
      <div className="contact-container">
        <div className="page-header">
          <h1 className="page-title">
            <i className="fas fa-envelope"></i>
            Liên Hệ Với Chúng Tôi
          </h1>
        </div>

        <div className="contact-content">
          <div className="contact-methods">
            <div className="info-section">
              <h3>
                <i className="fas fa-info-circle"></i>
                Thông Tin Liên Hệ
              </h3>
              <div className="info-grid">
                <div className="info-item">
                  <i className="fas fa-clock"></i>
                  <div>
                    <h4>Giờ Hoạt Động</h4>
                    <p>Thứ 2 - Chủ Nhật: 8:00 - 22:00</p>
                  </div>
                </div>
                <div className="info-item">
                  <i className="fas fa-headset"></i>
                  <div>
                    <h4>Hỗ Trợ</h4>
                    <p>Hỗ trợ 24/7 qua chat online</p>
                  </div>
                </div>
                <div className="info-item">
                  <i className="fas fa-shipping-fast"></i>
                  <div>
                    <h4>Giao Hàng</h4>
                    <p>Toàn quốc, giao trong 24-48h</p>
                  </div>
                </div>
                <div className="info-item">
                  <i className="fas fa-shield-alt"></i>
                  <div>
                    <h4>Bảo Hành</h4>
                    <p>Chế độ bảo hành chính hãng</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="contact-method facebook">
              <div className="method-icon">
                <i className="fas fa-comments"></i>
              </div>
              <div className="method-info">
                <h3>Zalo</h3>
                <p>Liên hệ trực tiếp với team hỗ trợ qua Zalo</p>
                <div className="method-details">
                  <span><i className="fas fa-clock"></i> Phản hồi trong 5-10 phút</span>
                  <span><i className="fas fa-users"></i> Hỗ trợ trực tiếp</span>
                </div>
                <Button 
                  variant="primary" 
                  onClick={() => openZaloImmediate()}
                >
                  <i className="fas fa-comments"></i>
                  Nhắn tin ngay
                </Button>
              </div>
            </div>

          </div>

          <div className="contact-info">
            <div className="faq-section">
              <h3>
                <i className="fas fa-question-circle"></i>
                Câu Hỏi Thường Gặp
              </h3>
              <div className="faq-list">
                <div className="faq-item">
                  <h4>Làm sao để thanh toán?</h4>
                  <p>Bạn có thể thanh toán chuyển khoản (VND) qua Zalo.</p>
                </div>
                <div className="faq-item">
                  <h4>Thời gian giao hàng bao lâu?</h4>
                  <p>Thời gian giao hàng từ 24-48 giờ tùy theo khu vực. Nội thành Hà Nội/HCM có thể giao trong ngày.</p>
                </div>
                <div className="faq-item">
                  <h4>Có chính sách đổi trả không?</h4>
                  <p>Chúng tôi có chính sách đổi trả trong 7 ngày với sản phẩm còn nguyên seal và đầy đủ phụ kiện.</p>
                </div>
                <div className="faq-item">
                  <h4>Sản phẩm có được bảo hành không?</h4>
                  <p>Tất cả sản phẩm đều được bảo hành chính hãng theo quy định của nhà sản xuất.</p>
                </div>
                <div className="faq-item">
                  <h4>Tôi có thể mua sản phẩm digital miễn phí ở đâu?</h4>
                  <p>Các sản phẩm digital miễn phí như wallpaper, preset, template có thể tải trực tiếp trên website mục "Tải Miễn Phí".</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;