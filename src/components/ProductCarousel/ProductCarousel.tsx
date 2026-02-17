import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, FreeMode, Autoplay } from 'swiper/modules';
import { SimpleProductCard } from '../SimpleProductCard/SimpleProductCard';
import type { Product } from '../../types';
import { useRef, memo, useCallback } from 'react';
import type { SwiperRef } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/free-mode';
import 'swiper/css/autoplay';
import './ProductCarousel.css';

interface ProductCarouselProps {
  products: Product[];
  slidesPerView?: number;
  spaceBetween?: number;
  showNavigation?: boolean;
  showPagination?: boolean;
  loop?: boolean;
}

// Coming Soon Placeholder Card Component
const PlaceholderCard = () => (
  <div className="coming-soon-card">
    <div className="coming-soon-image">
      <div className="coming-soon-content">
        <i className="fas fa-clock"></i>
        <span>Coming Soon</span>
      </div>
    </div>
    <div className="coming-soon-info">
      <h3>Sản phẩm sắp ra mắt</h3>
      <p>Đang cập nhật</p>
    </div>
  </div>
);

const ProductCarousel: React.FC<ProductCarouselProps> = memo(({
  products,
  slidesPerView = 4,
  spaceBetween = 24,
  showNavigation = true,
  showPagination = false,
  loop = true,
}) => {
  const navigate = useNavigate();
  const swiperRef = useRef<SwiperRef>(null);

  const handlePrev = useCallback(() => {
    if (swiperRef.current && swiperRef.current.swiper) {
      swiperRef.current.swiper.slidePrev();
    }
  }, []);

  const handleNext = useCallback(() => {
    if (swiperRef.current && swiperRef.current.swiper) {
      swiperRef.current.swiper.slideNext();
    }
  }, []);

  return (
    <div className="product-carousel-wrapper">
      <div className="product-carousel-container">
        {/* Custom Navigation Buttons */}
        {showNavigation && (
          <>
            <button 
              className="carousel-nav-btn carousel-prev" 
              onClick={handlePrev}
              aria-label="Previous slide"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <button 
              className="carousel-nav-btn carousel-next" 
              onClick={handleNext}
              aria-label="Next slide"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </>
        )}
        
        <Swiper
          ref={swiperRef}
          modules={[Navigation, Pagination, FreeMode, Autoplay]}
          spaceBetween={spaceBetween}
          slidesPerView={1}
          pagination={showPagination ? { 
            clickable: true,
            dynamicBullets: true,
          } : false}
          loop={loop && products.length >= slidesPerView}
          grabCursor={true}
          slidesPerGroup={1}
          speed={600}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          breakpoints={{
            // Mobile small - show 1 card with peek
            320: {
              slidesPerView: 1.2,
              spaceBetween: 16,
              centeredSlides: false,
            },
            // Mobile large - show 2 cards
            480: {
              slidesPerView: 2,
              spaceBetween: 16,
              centeredSlides: false,
            },
            // Tablet portrait - show 2.5 cards
            640: {
              slidesPerView: 2.5,
              spaceBetween: 20,
              centeredSlides: false,
            },
            // Tablet landscape - show 3 cards
            768: {
              slidesPerView: 3,
              spaceBetween: 20,
              centeredSlides: false,
            },
            // Small desktop - show 3.5 cards
            1024: {
              slidesPerView: 3.5,
              spaceBetween: 24,
              centeredSlides: false,
            },
            // Desktop - show full slidesPerView
            1280: {
              slidesPerView: slidesPerView,
              spaceBetween: spaceBetween,
              centeredSlides: false,
            },
          }}
          className="product-swiper"
        >
          {products.map((product: any) => (
            <SwiperSlide key={product.id}>
              {product.isPlaceholder ? (
                <PlaceholderCard />
              ) : (
                <SimpleProductCard
                  product={product}
                  onViewDetails={(id: string | number) => navigate(`/product/${id}`)}
                />
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
});

ProductCarousel.displayName = 'ProductCarousel';

export default ProductCarousel;
