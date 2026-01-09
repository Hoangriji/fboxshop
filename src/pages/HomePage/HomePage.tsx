import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "../../hooks/useProducts";
import { useProductStore } from "../../store/productStore";
import ProductCarousel from "../../components/ProductCarousel/ProductCarousel";
import { LazySection } from "../../components/LazySection";
import { SkeletonCarousel, SkeletonCard } from "../../components/Skeleton";
import { TechButton } from "../../components/TechButton";
import Button from "../../components/Button";
import { openZaloImmediate } from "../../utils/zaloHelper";
import "./HomePage.css";

const HomePage = () => {
  const navigate = useNavigate();
  const { products } = useProducts();
  const { setProducts, getFeaturedProducts, getDigitalProducts } =
    useProductStore();

  // Load products in background (non-blocking)
  useEffect(() => {
    if (products.length > 0) {
      setProducts(products);
    }
  }, [products, setProducts]);

  // Memoize expensive computations
  const featuredProducts = useMemo(() => {
    if (products.length === 0) return [];
    return getFeaturedProducts();
  }, [products, getFeaturedProducts]);
  
  const digitalProducts = useMemo(() => {
    if (products.length === 0) return [];
    return getDigitalProducts().filter((p) => p.is_free);
  }, [products, getDigitalProducts]);

  const handleCategoryClick = (category: string) => {
    navigate(`/products?category=${category}`);
  };

  return (
    <div className="home-page">
      {/* Hero Section - Renders IMMEDIATELY */}
      <section className="hero-section">
        <div className="hero-wrapper">
          <div className="hero-content">
            <h1 className="hero-title">
              Chào Mừng Bạn Đến Với USide Shop
            </h1>
            <p className="hero-description">
              Khám phá bộ sưu tập gaming hardware chất lượng cao và digital
              products.
            </p>
          </div>
        </div>

        {/* Categories Grid - Separate from hero-wrapper */}
        <div className="hero-categories-container">
          <div className="hero-categories">
            <div
              className="category-item"
              onClick={() => handleCategoryClick("keyboard")}
            >
              <div className="category-icon-wrapper">
                <i className="fas fa-keyboard"></i>
              </div>
              <span>Bàn Phím</span>
            </div>
            <div
              className="category-item"
              onClick={() => handleCategoryClick("headset")}
            >
              <div className="category-icon-wrapper">
                <i className="fas fa-headphones"></i>
              </div>
              <span>Tai Nghe</span>
            </div>
            <div
              className="category-item"
              onClick={() => handleCategoryClick("mouse")}
            >
              <div className="category-icon-wrapper">
                <i className="fas fa-mouse"></i>
              </div>
              <span>Chuột</span>
            </div>
            <div
              className="category-item"
              onClick={() => handleCategoryClick("monitor")}
            >
              <div className="category-icon-wrapper">
                <i className="fa-solid fa-desktop"></i>
              </div>
              <span>Màn Hình</span>
            </div>
            <div
              className="category-item"
              onClick={() => handleCategoryClick("usb")}
            >
              <div className="category-icon-wrapper">
                <i className="fa-brands fa-usb"></i>
              </div>
              <span>USB</span>
            </div>
            <div
              className="category-item"
              onClick={() => handleCategoryClick("digital")}
            >
              <div className="category-icon-wrapper">
                <i className="fas fa-file-download"></i>
              </div>
              <span>Tài Liệu Số</span>
            </div>
            <div
              className="category-item"
              onClick={() => handleCategoryClick("other")}
            >
              <div className="category-icon-wrapper">
                <i className="fas fa-plus"></i>
              </div>
              <span>Sản phẩm Khác</span>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="about-section">
        <div className="about-container">
          {/* Left side - Images */}
          <div className="about-images">
            <div className="about-image-grid">
              <div className="about-image-card about-main-image">
                <img
                  src="https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=600&h=600&fit=crop"
                  alt="Gaming Keyboard"
                  loading="lazy"
                />
                <div className="about-image-overlay">
                  <i className="fas fa-keyboard"></i>
                </div>
              </div>
              <div className="about-image-card">
                <img
                  src="https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&h=400&fit=crop"
                  alt="Gaming Mouse"
                  loading="lazy"
                />
                <div className="about-image-overlay">
                  <i className="fas fa-mouse"></i>
                </div>
              </div>
              <div className="about-image-card">
                <img
                  src="https://images.unsplash.com/photo-1599669454699-248893623440?w=400&h=400&fit=crop"
                  alt="Gaming Headset"
                  loading="lazy"
                />
                <div className="about-image-overlay">
                  <i className="fas fa-headphones"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Content */}
          <div className="about-content">
            <div className="about-header">
              <span className="about-tag">
                <i className="fas fa-info-circle"></i>
                Về chúng tôi
              </span>
              <h2 className="about-title">
                Nơi Hội Tụ Những <span className="highlight">Gaming Gear</span> Đỉnh Cao
              </h2>
            </div>

            <div className="about-description">
              <p>
                <strong>USide Shop</strong> là điểm đến hàng đầu cho những game thủ và tech enthusiasts 
                tìm kiếm thiết bị công nghệ chất lượng cao. Chúng tôi tự hào mang đến bộ sưu tập đa dạng 
                từ gaming peripherals đến digital products.
              </p>
              <p>
                Với cam kết về chất lượng và dịch vụ khách hàng tận tâm, chúng tôi không chỉ bán sản phẩm 
                mà còn đồng hành cùng bạn trong hành trình chinh phục đỉnh cao gaming.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section - Lazy Load */}
      <LazySection
        threshold={0.1}
        rootMargin="100px"
        fallback={
          <section className="featured-section">
            <div className="content-section">
              <div className="section-header">
                <h2 className="section-title">
                  <i className="fas fa-star"></i>
                  Sản Phẩm Nổi Bật
                </h2>
                <p className="section-description">
                  Những sản phẩm gaming gear được yêu thích nhất
                </p>
              </div>
              <SkeletonCarousel items={4} />
            </div>
          </section>
        }
      >
        <section className="featured-section">
          {featuredProducts.length > 0 ? (
            <section className="content-section">
              <div className="section-header">
                <h2 className="section-title">
                  <i className="fas fa-star"></i>
                  Sản Phẩm Nổi Bật
                </h2>
                <p className="section-description">
                  Những sản phẩm gaming gear được yêu thích nhất
                </p>
              </div>

              <ProductCarousel
                products={featuredProducts}
                slidesPerView={4}
                spaceBetween={24}
                showNavigation={true}
                showPagination={false}
                loop={true}
              />

              <div className="section-footer">
                <TechButton
                  variant="primary"
                  className="section-nav-btn"
                  onClick={() => navigate("/products")}
                >
                  Xem tất cả sản phẩm
                </TechButton>
              </div>
            </section>
          ) : (
            <section className="content-section">
              <div className="section-header">
                <h2 className="section-title">
                  <i className="fas fa-star"></i>
                  Sản Phẩm Nổi Bật
                </h2>
                <p className="section-description">
                  Những sản phẩm gaming gear được yêu thích nhất
                </p>
              </div>
              <SkeletonCarousel items={4} />
            </section>
          )}
        </section>
      </LazySection>

      {/* Free Digital Products Section */}
      <LazySection
        threshold={0.1}
        rootMargin="100px"
        fallback={
          <section className="digital-section">
            <div className="content-section">
              <div className="section-header">
                <h2 className="section-title">
                  <i className="fas fa-download"></i>
                  Tải Miễn Phí
                </h2>
                <p className="section-description">
                  Wallpaper, preset và template chất lượng cao - miễn phí
                </p>
              </div>
              <SkeletonCarousel items={4} />
            </div>
          </section>
        }
      >
        <section className="digital-section">
          {digitalProducts.length > 0 ? (
            <section className="content-section">
              <div className="section-header">
                <h2 className="section-title">
                  <i className="fas fa-download"></i>
                  Tải Miễn Phí
                </h2>
                <p className="section-description">
                  Wallpaper, preset và template chất lượng cao - miễn phí
                </p>
              </div>

              <ProductCarousel
                products={digitalProducts}
                slidesPerView={4}
                spaceBetween={24}
                showNavigation={true}
                showPagination={false}
                loop={true}
              />

              <div className="section-footer">
                <TechButton
                  variant="primary"
                  className="section-nav-btn"
                  onClick={() => navigate("/products?category=digital")}
                >
                  Khám phá thêm
                </TechButton>
              </div>
            </section>
          ) : (
            <section className="content-section">
              <div className="section-header">
                <h2 className="section-title">
                  <i className="fas fa-download"></i>
                  Tải Miễn Phí
                </h2>
                <p className="section-description">
                  Wallpaper, preset và template chất lượng cao - miễn phí
                </p>
              </div>
              <SkeletonCarousel items={4} />
            </section>
          )}
        </section>
      </LazySection>



      {/* Contact Section - Lazy Load */}
      <LazySection
        threshold={0.3}
        rootMargin="0px"
        fallback={
          <section id="contact" className="contact-section">
            <div className="section-header">
              <h2 className="section-title">
                <i className="fas fa-comments"></i>
                Liên Hệ & Thanh Toán
              </h2>
              <p className="section-description">
                Chọn phương thức liên hệ phù hợp với bạn
              </p>
            </div>
            <SkeletonCard count={2} />
          </section>
        }
      >
        <section id="contact" className="contact-section">
        <div className="section-header">
          <h2 className="section-title">
            <i className="fas fa-comments"></i>
            Liên Hệ & Thanh Toán
          </h2>
          <p className="section-description">
            Chọn phương thức liên hệ phù hợp với bạn
          </p>
        </div>

        <div className="contact-grid">
          <div className="contact-card facebook">
            <div className="contact-icon">
              <i className="fas fa-comments"></i>
            </div>
            <h3>Zalo</h3>
            <p>Thanh toán VND, tư vấn sản phẩm</p>
            <Button 
              variant="primary"
              onClick={() => openZaloImmediate()}
            >
              Chat ngay
            </Button>
          </div>

          {/* TEMPORARILY DISABLED - Discord/Coin payment */}
          {/* <div className="contact-card discord">
            <div className="contact-icon">
              <i className="fab fa-discord"></i>
            </div>
            <h3>Discord Server</h3>
            <p>Thanh toán USide Coin</p>
            <Button variant="secondary">Join server</Button>
          </div> */}
        </div>
      </section>
      </LazySection>
    </div>
  );
};

export default HomePage;
