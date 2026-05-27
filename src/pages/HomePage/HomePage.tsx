import { useNavigate } from "react-router-dom";
import { useFeaturedProducts } from "../../hooks/useFeaturedProducts";
import { useSiteConfig } from "../../hooks/useSiteConfig";
import { useOptimizedHeroImage } from "../../hooks/useOptimizedHeroImage";
import ProductCarousel from "../../components/ProductCarousel/ProductCarousel";
import { LazySection } from "../../components/LazySection";
import { SkeletonCarousel } from "../../components/Skeleton";
import Button from "../../components/Button";
import { TechButton } from "../../components/TechButton";
import { openZaloImmediate } from "../../utils/zaloHelper";
import "./HomePage.css";

const HomePage = () => {
  const navigate = useNavigate();
  const { featuredProducts } = useFeaturedProducts();
  // const { featuredProducts, freeDigitalProducts } = useFeaturedProducts(); // ẩn digital
  const { config } = useSiteConfig();
  
  // Get hero image from config with optimization and caching
  const heroImageUrl = config?.site?.hero_image_url;
  const heroImagePublicId = config?.site?.hero_image_public_id;
  
  const { 
    optimizedUrl, 
    shouldShowBlur 
  } = useOptimizedHeroImage(heroImageUrl, heroImagePublicId);

  const handleCategoryClick = (category: string) => {
    navigate(`/products?category=${category}`);
  };

  return (
    <div className="home-page">
      {/* Hero Section - Renders IMMEDIATELY with optimized image */}
      <section 
        className={`hero-section ${shouldShowBlur ? 'hero-loading' : 'hero-loaded'}`}
        style={optimizedUrl ? {
          '--hero-bg-image': `url(${optimizedUrl})`
        } as React.CSSProperties : undefined}
      >
        <div className="hero-wrapper">
          <div className="hero-content">
            <h1 className="hero-title">
              Chào Mừng Bạn Đến Với USide Shop
            </h1>
            <p className="hero-description">
              Khám phá bộ sưu tập gaming hardware chất lượng cao.{/* ẩn digital: và digital products. */}
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
            {/* ẩn digital */}
            {/*
            <div
              className="category-item"
              onClick={() => handleCategoryClick("digital")}
            >
              <div className="category-icon-wrapper">
                <i className="fas fa-file-download"></i>
              </div>
              <span>Tài Liệu Số</span>
            </div>
            */}
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
                từ gaming peripherals.{/* ẩn digital: đến digital products. */}
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

      {/* ẩn digital */}
      {/*
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
          {freeDigitalProducts.length > 0 ? (
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
                products={freeDigitalProducts}
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
      */}



      {/* Contact Section - Lazy Load */}
      <LazySection
        threshold={0.3}
        rootMargin="0px"
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


        </div>
      </section>
      </LazySection>
    </div>
  );
};

export default HomePage;
