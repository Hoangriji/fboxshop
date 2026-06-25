import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Product } from "../../types";
import { useFeaturedProducts } from "../../hooks/useFeaturedProducts";
import { useSiteConfig } from "../../hooks/useSiteConfig";
import { useCategories } from "../../hooks/useCategories";
import { ProductsService } from "../../services/firebaseService";
import ProductCarousel from "../../components/ProductCarousel/ProductCarousel";
import { SkeletonCarousel } from "../../components/Skeleton";
import Button from "../../components/Button";
import { openZaloImmediate } from "../../utils/zaloHelper";
import "./HomePage.css";

const HERO_LIMIT = 5;

const SLIDES = [
  { id: "hero", label: "Trang chủ", icon: "fa-home" },
  { id: "categories", label: "Danh mục", icon: "fa-layer-group" },
  { id: "featured", label: "Nổi bật", icon: "fa-star" },
  { id: "about", label: "Về chúng tôi", icon: "fa-info-circle" },
  { id: "contact", label: "Liên hệ", icon: "fa-comments" },
];

const HomePage = () => {
  const navigate = useNavigate();
  const { featuredProducts } = useFeaturedProducts();
  const { config } = useSiteConfig();
  const { categories } = useCategories();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const slideRefs = useRef<Record<string, HTMLElement | null>>({});
  const heroTimerRef = useRef<number | null>(null);

  const [heroProducts, setHeroProducts] = useState<Product[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [activeSlide, setActiveSlide] = useState("hero");
  const [railOpen, setRailOpen] = useState(false);

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  const heroProductIds = useMemo(
    () => config?.site?.hero_product_ids ?? [],
    [config?.site?.hero_product_ids],
  );

  const physicalCategories = useMemo(
    () => categories.filter((category) => category.type !== "digital"),
    [categories],
  );

  useEffect(() => {
    let active = true;

    const loadHeroProducts = async () => {
      if (heroProductIds.length > 0) {
        const selected = await ProductsService.getProductsByIds(
          heroProductIds.slice(0, HERO_LIMIT),
        );
        if (active) {
          setHeroProducts(
            selected.filter((product) => product.type !== "digital"),
          );
        }
        return;
      }

      const fallback = featuredProducts
        .filter((item): item is Product => !("isPlaceholder" in item))
        .filter((product) => product.type !== "digital")
        .slice(0, HERO_LIMIT);

      if (active) {
        setHeroProducts(fallback);
      }
    };

    void loadHeroProducts();

    return () => {
      active = false;
    };
  }, [heroProductIds, featuredProducts]);

  useEffect(() => {
    if (heroProducts.length === 0) return;
    if (heroIndex >= heroProducts.length) {
      setHeroIndex(0);
    }
  }, [heroIndex, heroProducts]);

  useEffect(() => {
    if (heroPaused || heroProducts.length <= 1) return;

    heroTimerRef.current = window.setTimeout(() => {
      setHeroIndex((prev) => (prev + 1) % heroProducts.length);
    }, 3000);

    return () => {
      if (heroTimerRef.current) {
        window.clearTimeout(heroTimerRef.current);
      }
    };
  }, [heroIndex, heroPaused, heroProducts.length]);

  useEffect(() => {
    const container = containerRef.current;
    const sections = Object.values(slideRefs.current).filter(
      Boolean,
    ) as HTMLElement[];
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute("data-slide") ?? "hero";
          if (entry.isIntersecting) {
            setActiveSlide(id);
            entry.target.classList.add("is-visible");
          } else {
            entry.target.classList.remove("is-visible");
          }
        });
      },
      { threshold: 0.55, root: container },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const parallaxNodes = Array.from(
      container.querySelectorAll<HTMLElement>("[data-parallax]"),
    );
    if (!parallaxNodes.length) return;

    let frame = 0;
    const handleScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        const scrollTop = container.scrollTop;
        parallaxNodes.forEach((node) => {
          const speed = Number(node.dataset.parallax ?? "0.2");
          node.style.transform = `translateX(${scrollTop * speed * -0.15}px)`;
        });
        frame = 0;
      });
    };

    container.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const activeHero = heroProducts[heroIndex];
  const activeIndex = SLIDES.findIndex((slide) => slide.id === activeSlide);
  const progress =
    activeIndex >= 0
      ? Math.round((activeIndex / (SLIDES.length - 1)) * 100)
      : 0;

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/products?category=${categoryId}`);
  };

  const handleSlideNav = (id: string) => {
    const target = slideRefs.current[id];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      setRailOpen(false);
    }
  };

  const handleHeroPrev = () => {
    if (heroProducts.length === 0) return;
    setHeroIndex(
      (prev) => (prev - 1 + heroProducts.length) % heroProducts.length,
    );
  };

  const handleHeroNext = () => {
    if (heroProducts.length === 0) return;
    setHeroIndex((prev) => (prev + 1) % heroProducts.length);
  };

  return (
    <div className="home-page snap-page" ref={containerRef}>
      <aside className={`slide-rail ${railOpen ? "open" : ""}`}>
        <button
          className="rail-toggle"
          type="button"
          onClick={() => setRailOpen((prev) => !prev)}
        >
          <i className={`fas ${railOpen ? "fa-chevron-left" : "fa-bars"}`}></i>
        </button>
        <div className="rail-body">
          <div className="rail-progress">
            <span>{progress}%</span>
            <div className="rail-progress-bar">
              <span style={{ height: `${progress}%` }}></span>
            </div>
          </div>
          <div className="rail-track">
            {SLIDES.map((slide) => (
              <button
                key={slide.id}
                type="button"
                className={`rail-item ${activeSlide === slide.id ? "active" : ""}`}
                onClick={() => handleSlideNav(slide.id)}
              >
                <span className="rail-icon">
                  <i className={`fas ${slide.icon}`}></i>
                </span>
                <span className="rail-label">{slide.label}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section
        className="home-slide hero-slide snap-section"
        data-slide="hero"
        ref={(el) => {
          slideRefs.current.hero = el;
        }}
      >
        <div
          className="hero-shell"
          style={
            activeHero?.images?.[0]
              ? ({
                  "--hero-bg": `url(${activeHero.images[0]})`,
                } as React.CSSProperties)
              : undefined
          }
        >
          <div className="hero-backdrop"></div>
          <div className="hero-inner">
            <div className="hero-copy">
              <span className="hero-eyebrow">Featured Gear</span>
              <h1 className="hero-title">
                {activeHero?.name ?? "GEAR UP YOUR SETUP"}
              </h1>
              <p className="hero-description">
                {activeHero?.description ??
                  "Khám phá bộ sưu tập gaming gear được tuyển chọn cho setup của bạn."}
              </p>
              <div className="hero-price">
                {activeHero?.price_vnd
                  ? `${activeHero.price_vnd.toLocaleString("vi-VN")}₫`
                  : ""}
              </div>
              <div className="hero-actions">
                <button
                  type="button"
                  className="btn-primary hero-cta"
                  onMouseEnter={() => setHeroPaused(true)}
                  onMouseLeave={() => setHeroPaused(false)}
                  onClick={() =>
                    activeHero && navigate(`/product/${activeHero.id}`)
                  }
                >
                  Xem chi tiết
                </button>
                <button
                  type="button"
                  className="btn-secondary hero-secondary"
                  onClick={() => navigate("/products")}
                >
                  Xem bộ sưu tập
                </button>
              </div>
            </div>
            <div className="hero-media">
              <div className="hero-card">
                {activeHero?.images?.[0] ? (
                  <img src={activeHero.images[0]} alt={activeHero.name} />
                ) : (
                  <div className="hero-card-placeholder"></div>
                )}
              </div>
            </div>
          </div>
          <div className="hero-controls">
            <button
              type="button"
              onClick={handleHeroPrev}
              aria-label="Previous"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <div className="hero-dots">
              {heroProducts.map((product, index) => (
                <button
                  key={product.id}
                  type="button"
                  className={index === heroIndex ? "active" : ""}
                  onClick={() => setHeroIndex(index)}
                  aria-label={`Hero ${index + 1}`}
                ></button>
              ))}
            </div>
            <button type="button" onClick={handleHeroNext} aria-label="Next">
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </section>

      <section
        className="home-slide categories-slide snap-section"
        data-slide="categories"
        ref={(el) => {
          slideRefs.current.categories = el;
        }}
      >
        <div className="slide-inner">
          <div className="slide-head">
            <span className="slide-eyebrow">Danh mục</span>
            <h2 className="slide-title">Chọn thiết bị phù hợp</h2>
            <p className="slide-subtitle">
              Chạm để đi thẳng tới bộ sưu tập bạn quan tâm.
            </p>
          </div>
          <div className="categories-grid">
            {physicalCategories.map((category, index) => (
              <button
                key={category.id}
                type="button"
                className="category-card"
                style={{ "--stagger-index": index } as React.CSSProperties}
                onClick={() => handleCategoryClick(category.id)}
              >
                <span className="category-icon">
                  <i className={category.icon}></i>
                </span>
                <span className="category-name">{category.name}</span>
                <span className="category-desc">{category.description}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="slide-bg-text" data-parallax="0.2">
          CATEGORIES
        </div>
      </section>

      <section
        className="home-slide featured-slide snap-section no-snap-mobile"
        data-slide="featured"
        ref={(el) => {
          slideRefs.current.featured = el;
        }}
      >
        <div className="slide-inner">
          <div className="slide-head">
            <span className="slide-eyebrow">Top picks</span>
            <h2 className="slide-title">Sản phẩm nổi bật</h2>
            {/* <p className="slide-subtitle">Những lựa chọn gaming gear được yêu thích nhất.</p> */}
          </div>

          <div className="featured-carousel">
            {featuredProducts.length > 0 ? (
              <ProductCarousel
                products={featuredProducts}
                slidesPerView={4}
                spaceBetween={24}
                showNavigation={true}
                showPagination={false}
                loop={true}
              />
            ) : (
              <SkeletonCarousel items={4} />
            )}
          </div>
        </div>
        <div className="slide-bg-text" data-parallax="0.25">
          PERFORMANCE
        </div>
      </section>

      <section
        className="home-slide about-slide snap-section"
        data-slide="about"
        ref={(el) => {
          slideRefs.current.about = el;
        }}
      >
        <div className="slide-inner about-grid">
          <div className="about-media">
            <div className="about-image">
              <img
                src="https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=600&h=600&fit=crop"
                alt="Gaming Keyboard"
                loading="lazy"
              />
            </div>
          </div>
          <div className="about-content">
            <span className="slide-eyebrow">Về chúng tôi</span>
            <h2 className="hero-title">
              Nơi hội tụ những <span className="highlight">Gaming Gear</span>{" "}
              đỉnh cao
            </h2>
            <p>
              <strong>Fbox Shop</strong> là điểm đến dành cho những game thủ và
              tech enthusiasts tìm kiếm thiết bị chất lượng cao, phù hợp mọi
              phong cách setup.
            </p>
            <p>
              Chúng tôi tập trung vào trải nghiệm mua sắm nhanh gọn, tư vấn tận
              tâm và sản phẩm được tuyển chọn kỹ lưỡng.
            </p>
            <div className="about-points">
              <div className="about-point">
                <span className="point-label">Tư vấn</span>
                <strong>Nhanh và rõ ràng</strong>
              </div>
              <div className="about-point">
                <span className="point-label">Sản phẩm</span>
                <strong>Chọn lọc kỹ</strong>
              </div>
              <div className="about-point">
                <span className="point-label">Bảo hành</span>
                <strong>Minh bạch</strong>
              </div>
            </div>
          </div>
        </div>
        <div className="slide-bg-text" data-parallax="0.18">
          CRAFTED
        </div>
      </section>

      <section
        className="home-slide contact-slide snap-section"
        data-slide="contact"
        ref={(el) => {
          slideRefs.current.contact = el;
        }}
      >
        <div className="slide-inner">
          <div className="slide-head">
            <span className="slide-eyebrow">Liên hệ</span>
            <h2 className="slide-title">Liên hệ & thanh toán</h2>
            <p className="slide-subtitle">
              Chọn phương thức phù hợp để được hỗ trợ nhanh nhất.
            </p>
          </div>

          <div className="contact-grid">
            <div className="contact-card">
              <div className="contact-icon">
                <i className="fas fa-comments"></i>
              </div>
              <h3>Zalo</h3>
              <p>Thanh toán VND, tư vấn sản phẩm</p>
              <Button variant="primary" onClick={() => openZaloImmediate()}>
                Chat ngay
              </Button>
            </div>
            <div className="contact-panel">
              <span className="contact-eyebrow">Hỗ trợ nhanh</span>
              <h3>Trao đổi và thanh toán</h3>
              <p>
                Kết nối qua Zalo để được tư vấn cấu hình và chốt đơn nhanh gọn.
              </p>
              <ul className="contact-list">
                <li>Gợi ý combo phù hợp ngân sách</li>
                <li>Thanh toán VND, xác nhận nhanh</li>
                <li>Hỗ trợ sau mua và bảo hành</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
