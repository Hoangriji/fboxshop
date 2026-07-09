import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import { SimpleProductCard } from '../SimpleProductCard/SimpleProductCard';
import type { Product } from '../../types';
import type { PlaceholderProduct } from '../../hooks/useFeaturedProducts';
import { useRef, memo, useCallback } from 'react';
import type { SwiperRef } from 'swiper/react';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/autoplay';
import './ProductSlider.css';

interface ProductSliderProps {
  products: (Product | PlaceholderProduct)[];
  slidesPerView?: number;
  spaceBetween?: number;
  showNavigation?: boolean;
  autoplay?: boolean;
}

const PlaceholderCard = () => (
  <div className="placeholder-card">
    <div className="placeholder-image">
      <div className="placeholder-content">
        <i className="fas fa-clock"></i>
        <span>Coming Soon</span>
      </div>
    </div>
    <div className="placeholder-info">
      <h3>Sản phẩm sắp ra mắt</h3>
      <p>Đang cập nhật</p>
    </div>
  </div>
);

const ProductSlider: React.FC<ProductSliderProps> = memo(({
  products,
  slidesPerView = 4,
  spaceBetween = 24,
  showNavigation = true,
  autoplay = true,
}) => {
  const navigate = useNavigate();
  const swiperRef = useRef<SwiperRef>(null);

  const handlePrev = useCallback(() => {
    if (swiperRef.current?.swiper) {
      swiperRef.current.swiper.slidePrev();
    }
  }, []);

  const handleNext = useCallback(() => {
    if (swiperRef.current?.swiper) {
      swiperRef.current.swiper.slideNext();
    }
  }, []);

  const canLoop = products.length > slidesPerView;

  return (
    <div className="product-slider-wrapper">
      <div className="product-slider-container">
        {showNavigation && (
          <>
            <button
              className="slider-nav-btn slider-prev"
              onClick={handlePrev}
              type="button"
              aria-label="Previous"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <button
              className="slider-nav-btn slider-next"
              onClick={handleNext}
              type="button"
              aria-label="Next"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </>
        )}

        <Swiper
          ref={swiperRef}
          modules={[Navigation, Autoplay]}
          slidesPerView={slidesPerView}
          spaceBetween={spaceBetween}
          loop={canLoop}
          grabCursor={true}
          speed={500}
          autoplay={autoplay ? { delay: 5000, disableOnInteraction: false } : false}
          navigation={false}
          breakpoints={{
            320: { slidesPerView: 1.1, spaceBetween: 16 },
            480: { slidesPerView: 2, spaceBetween: 16 },
            640: { slidesPerView: 2.5, spaceBetween: 20 },
            768: { slidesPerView: 3, spaceBetween: 20 },
            1024: { slidesPerView: 3.5, spaceBetween: 24 },
            1280: { slidesPerView: slidesPerView, spaceBetween },
          }}
          className="product-swiper"
        >
          {products.map((product) => (
            <SwiperSlide key={product.id}>
              {'isPlaceholder' in product && product.isPlaceholder ? (
                <PlaceholderCard />
              ) : (
                <SimpleProductCard
                  product={product as Product}
                  onViewDetails={(id) => navigate(`/product/${id}`)}
                />
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
});

ProductSlider.displayName = 'ProductSlider';

export default ProductSlider;