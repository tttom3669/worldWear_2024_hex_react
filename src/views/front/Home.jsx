import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import AOS from 'aos';
import 'aos/dist/aos.css';

// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import { Tab } from 'bootstrap';
// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import useImgUrl from '../../hooks/useImgUrl';
import FrontHeader from '../../components/front/FrontHeader';
import { productCategories as productCategoriesData } from '../../slice/productsSlice';
import { Link } from 'react-router-dom';
const { VITE_API_PATH: API_PATH } = import.meta.env;

export default function Home() {
  const productCategories = useSelector(productCategoriesData);
  const getImgUrl = useImgUrl();
  const [popularProducts, setPopularProducts] = useState([]);
  const tabRef = useRef(null);
  const swiperRefs = useRef({});

  useEffect(() => {
    new Tab(tabRef.current);
    getPopularProducts();
    AOS.init();

    // You can also pass an optional settings object
    // below listed default settings
    AOS.init({
      // Global settings:
      disable: false, // accepts following values: 'phone', 'tablet', 'mobile', boolean, expression or function
      startEvent: 'DOMContentLoaded', // name of the event dispatched on the document, that AOS should initialize on
      initClassName: 'aos-init', // class applied after initialization
      animatedClassName: 'aos-animate', // class applied on animation
      useClassNames: false, // if true, will add content of `data-aos` as classes on scroll
      disableMutationObserver: false, // disables automatic mutations' detections (advanced)
      debounceDelay: 50, // the delay on debounce used while resizing window (advanced)
      throttleDelay: 99, // the delay on throttle used while scrolling the page (advanced)

      // Settings that can be overridden on per-element basis, by `data-aos-*` attributes:
      offset: 300, // offset (in px) from the original trigger point
      delay: 0, // values from 0 to 3000, with step 50ms
      duration: 700, // values from 0 to 3000, with step 50ms
      easing: 'ease', // default easing for AOS animations
      once: true, // whether animation should happen only once - while scrolling down
      mirror: false, // whether elements should animate out while scrolling past them
      anchorPlacement: 'top-bottom', // defines which position of the element regarding to window should trigger the animation
    });
  }, []);

  const handleNextSlide = (swiperSlug) => {
    swiperRefs.current[swiperSlug].slideNext();
  };
  const handlePrevSlide = (swiperSlug) => {
    swiperRefs.current[swiperSlug].slidePrev();
  };

  const getPopularProducts = async () => {
    const res = await axios.get(`${API_PATH}/products`);
    const filterProducts = res.data.filter((product) => product.is_hot);
    setPopularProducts(filterProducts);
  };

  return (
    <>
      <title>首頁 - WorldWear</title>
      <FrontHeader defaultType={'dark'} />
      <main className="site-index">
        <div className="site-index__banner">
          <div
            className="w-100 h-50 w-md-50 h-md-100 bg-center bg-no-repeat bg-cover text-white d-flex justify-content-center align-items-end pb-10 pb-lg-20"
            style={{
              backgroundImage: `url(${getImgUrl(
                '/images/home/index-banner-l.png'
              )})`,
            }}
          >
            <div className="d-flex flex-column text-center position-relative z-1">
              <p className="fw-bold tracking-md fs-base fs-md-h6">Shop</p>
              <h2 className="fs-dh2 fs-md-dh1 tracking-md fst-italic font-dm-serif">
                WOMAN
              </h2>
            </div>
          </div>
          <div
            className="w-100 h-50 w-md-50 h-md-100 bg-center bg-no-repeat bg-cover text-white d-flex justify-content-center align-items-end pb-10 pb-lg-20"
            style={{
              backgroundImage: `url(${getImgUrl(
                '/images/home/index-banner-r.png'
              )})`,
            }}
          >
            <div className="d-flex flex-column text-center position-relative z-1">
              <p className="fw-bold tracking-md fs-base fs-md-h6">Shop</p>
              <h2 className="fs-dh2 fs-md-dh1 tracking-md fst-italic font-dm-serif">
                MAN
              </h2>
            </div>
          </div>
        </div>

        <section className="py-8 py-md-10 section__activity">
          <div
            className="container position-relative z-1 text-center"
            data-aos="fade-up"
          >
            <div className="d-flex gap-3 flex-column">
              <h2 className="text-secondary-60  fs-h6 fw-bold text-md-secondary-40 fs-md-h4">
                {/* 全館三件免運 */}
                新會員優惠 10% off
              </h2>
              <h3 className="fs-h1 fst-italic font-dm-serif fw-normal  fs-md-dh2">
                {/* Free Shipping */}
                worldWear
              </h3>
              <p>2025/01/01-2025/12/31</p>
              {/* <p className="fs-sm">(不含部份商品)</p> */}
            </div>
          </div>
        </section>

        <section className="section__slogan py-10 overflow-hidden py-md-20">
          <div className="container">
            <div className="d-flex justify-content-between align-items-xl-start flex-column flex-xl-row">
              <div className="position-relative">
                <div className="position-relative z-1">
                  <div className="bg-primary-50 mb-3 w-24px h-24px">&nbsp;</div>
                  <h2 className="d-flex flex-column fw-bold fs-h3 fs-md-dh1">
                    <span data-aos="fade-left">穿出你的風格</span>
                    <span data-aos="fade-right">展現你的自信</span>
                  </h2>
                </div>
                <div className="section__slogan-text" data-aos="fade-up">
                  <p>Style&Confidante</p>
                  <p>Style&Confidante</p>
                  <p>Style&Confidante</p>
                </div>
              </div>
              <div className="section__slogan-img">
                <img
                  data-aos="fade-left"
                  className="section__slogan-img--1"
                  src={getImgUrl('/images/home/section-slogan-1.png')}
                  alt="Style&Confidante"
                />
                <img
                  data-aos="fade-right"
                  className="section__slogan-img--2"
                  src={getImgUrl('/images/home/section-slogan-2.png')}
                  alt="Style&Confidante"
                />
              </div>
            </div>
          </div>
        </section>

        <section
          className="section__productCategories py-10  bg-nature-95 bg-md-nature-99"
          data-aos="fade-up"
        >
          <div className="container">
            <nav className="d-flex justify-content-center w-100 mb-6 mb-md-10 w-sm-auto">
              <div
                className="nav nav-tabs section__productCategories-nav"
                id="nav-tab"
                role="tablist"
                ref={tabRef}
              >
                {productCategories.map((gender) => (
                  <button
                    className={`nav-link ${
                      gender.slug === 'women' ? 'active' : ''
                    }`}
                    id={`nav-${gender.slug}-tab`}
                    data-bs-toggle="tab"
                    data-bs-target={`#nav-${gender.slug}`}
                    type="button"
                    role="tab"
                    aria-controls={`nav-${gender.slug}`}
                    aria-selected="true"
                    key={gender.slug}
                  >
                    {gender.title}
                  </button>
                ))}
              </div>
            </nav>
          </div>
          <div className="container-sm">
            <div className="tab-content" id="nav-tabContent">
              {productCategories.map((gender) => (
                <div
                  className={`tab-pane fade show ${
                    gender.slug === 'women' ? 'active' : ''
                  }`}
                  id={`nav-${gender.slug}`}
                  role="tabpanel"
                  aria-labelledby={`nav-${gender.slug}-tab`}
                  tabIndex="0"
                  key={gender.slug}
                >
                  <div className="swiper-container swiper__productCategories-container">
                    <Swiper
                      className="swiper__productCategories text-white"
                      modules={[Pagination]}
                      slidesPerView={1.375}
                      spaceBetween={24}
                      breakpoints={{
                        576: {
                          slidesPerGroup: 2,
                          slidesPerView: 2,
                        },
                        768: {
                          slidesPerGroup: 3,
                          slidesPerView: 3,
                        },
                        992: {
                          slidesPerGroup: 4,
                          slidesPerView: 4,
                        },
                      }}
                      pagination={{ clickable: true }}
                      onSwiper={(swiper) => {
                        swiperRefs.current[gender.slug] = swiper;
                      }}
                    >
                      {gender.categories.map((category) =>
                        category.slug !== 'product-status' ? (
                          <SwiperSlide key={category.slug}>
                            <div
                              className="swiper__productCategories-item swiper__productCategories-item--dark "
                              style={{
                                backgroundImage: `url(${getImgUrl(
                                  category.imageUrl
                                )})`,
                              }}
                            >
                              <div className="pb-7 text-center d-flex flex-column justify-content-end h-100">
                                <Link
                                  to={`/products/${category.slug}`}
                                  className="text-reset stretched-link"
                                >
                                  <h2 className="fs-sm fs-md-h6 fw-bold">
                                    {category.title}
                                  </h2>
                                </Link>
                                <h3
                                  className={`${
                                    category.slug !== 'accessories'
                                      ? 'fs-dh2 fs-md-dh1'
                                      : 'fs-h2 fs-md-h1'
                                  } fst-italic fw-normal font-dm-serif`}
                                >
                                  {category.slug[0].toUpperCase() +
                                    category.slug.slice(1)}
                                </h3>
                              </div>
                            </div>
                          </SwiperSlide>
                        ) : (
                          ''
                        )
                      )}
                    </Swiper>
                    <div
                      className="swiper-button-prev"
                      onClick={() => handlePrevSlide(gender.slug)}
                    >
                      <svg className="pe-none" width="18" height="32">
                        <use href={getImgUrl('/icons/prev.svg#prev')}></use>
                      </svg>
                    </div>
                    <div
                      className="swiper-button-next"
                      onClick={() => handleNextSlide(gender.slug)}
                    >
                      <svg className="pe-none" width="18" height="32">
                        <use href={getImgUrl('/icons/next.svg#next')}></use>
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          className="py-10 py-md-20 bg-nature-95 bg-md-nature-99"
          data-aos="fade-up"
          data-aos-delay="500"
        >
          <div className="container-sm">
            <h2 className="fs-h5 fs-md-h2 fw-bold mb-6">熱門商品</h2>
            <div className="swiper-container swiper__popularProducts-container">
              <Swiper
                className="swiper__popularProducts"
                modules={[Pagination]}
                slidesPerView={1.375}
                spaceBetween={24}
                breakpoints={{
                  576: {
                    slidesPerGroup: 2,
                    slidesPerView: 2,
                  },
                  768: {
                    slidesPerGroup: 3,
                    slidesPerView: 3,
                  },
                }}
                pagination={{ clickable: true }}
                onSwiper={(swiper) => {
                  swiperRefs.current['popularProducts'] = swiper;
                }}
              >
                {' '}
                {popularProducts.map((product) => (
                  <SwiperSlide className="position-relative" key={product.id}>
                    <img
                      className="w-100 img-fluid object-fit-cover mb-3"
                      src={product.imageUrl}
                      alt={product.title}
                    />
                    <Link
                      to={`/product/${product.id}`}
                      className="stretched-link link-black"
                    >
                      <h3 className="d-flex flex-column gap-0 gap-md-1 tracking-sm fs-sm fs-md-base lh-base fw-normal">
                        <span>{product.title}</span>
                        <span>{product.categoryItems}</span>
                      </h3>
                    </Link>
                  </SwiperSlide>
                ))}
              </Swiper>
              <div
                className="swiper-button-prev"
                onClick={() => handlePrevSlide('popularProducts')}
              >
                <svg className="pe-none" width="18" height="32">
                  <use href={getImgUrl('/icons/prev.svg#prev')}></use>
                </svg>
              </div>
              <div
                className="swiper-button-next"
                onClick={() => handleNextSlide('popularProducts')}
              >
                <svg className="pe-none" width="18" height="32">
                  <use href={getImgUrl('/icons/next.svg#next')}></use>
                </svg>
              </div>
            </div>
          </div>
        </section>

        <section
          className="section__features py-10 py-md-20"
          data-aos="fade-up"
          data-aos-delay="500"
        >
          <div className="container">
            <div className="row">
              <div className="col-12 col-lg-4 section__features-card d-flex mb-6">
                <div className="flex-grow-1 p-5 p-lg-7 bg-secondary-60 text-white features-card__content">
                  <h2 className="mb-2 fs-base fs-lg-h5 fw-bold">
                    豐富的商品種類
                  </h2>
                  <p className="mb-2 fs-sm fs-lg-base fw-normal">
                    從潮流單品到經典款式
                    <br />
                    應有盡有
                  </p>
                  <p className="features-card__title font-dm-serif fst-italic fs-h3 fs-lg-dh1 opacity-60">
                    SHOP
                  </p>
                </div>
                <img
                  className="section__features-img"
                  src={getImgUrl('/images/home/features-img-1.png')}
                  alt=""
                />
              </div>
              <div className="col-12 col-lg-4 section__features-card d-flex mb-6">
                <div className="flex-grow-1 p-5 p-lg-7 bg-primary-80 text-black features-card__content">
                  <h2 className="mb-2 fs-base fs-lg-h5 fw-bold">
                    優惠的代購價格
                  </h2>
                  <p className="mb-2 fs-sm fs-lg-base fw-normal">
                    批量採購
                    <br />
                    為您節省更多
                  </p>
                  <p className="features-card__title font-dm-serif fst-italic fs-h3 fs-lg-dh1 opacity-60">
                    SAVE
                  </p>
                </div>
                <img
                  className="section__features-img"
                  src={getImgUrl('/images/home/features-img-2.png')}
                  alt=""
                />
              </div>
              <div className="col-12 col-lg-4 section__features-card d-flex mb-6">
                <div className="flex-grow-1 p-5 p-lg-7 bg-nature-50 text-white features-card__content">
                  <h2 className="mb-2 fs-base fs-lg-h5 fw-bold">
                    便捷的購物體驗
                  </h2>
                  <p className="mb-2 fs-sm fs-lg-base fw-normal">
                    從選購到收貨
                    <br />
                    全程輕鬆無憂
                  </p>
                  <p className="features-card__title font-dm-serif fst-italic fs-h3 fs-lg-dh1 opacity-60">
                    FAST
                  </p>
                </div>
                <img
                  className="section__features-img"
                  src={getImgUrl('/images/home/features-img-3.png')}
                  alt=""
                />
              </div>
            </div>
          </div>
        </section>

        <section
          className="section__comment pt-6  pb-25 pt-md-10 pb-md-30"
          data-aos="fade-up"
          data-aos-delay="500"
        >
          <div className="container">
            <h2 className="fs-h5 fs-md-h2 fw-bold mb-6">熱門好評</h2>
            <div className="row row-gap-3 row-gap-md-6">
              <div className="col-md-6 col-lg-3">
                <div className="bg-nature-95 p-4 p-md-6 h-100">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="rounded-circle overflow-hidden w-24px h-24px w-md-40px h-md-40px">
                      <img
                        className="img-fluid object-fit-cover w-100 h-100 d-block"
                        src={getImgUrl('/images/home/comment-1.png')}
                        alt="comment-1"
                      />
                    </div>
                    <h3 className="fs-xs fs-md-h6 fw-bold">陳志豪</h3>
                  </div>
                  <p className="fs-sm tracking-sm fs-md-base">
                    外套質量超乎預期！面料柔軟舒適，剪裁合身。冬天保暖又時尚，絕對值得購買。
                  </p>
                </div>
              </div>
              <div className="col-md-6 col-lg-3">
                <div className="bg-nature-95 p-4 p-md-6 h-100">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="rounded-circle overflow-hidden w-24px h-24px w-md-40px h-md-40px">
                      <img
                        className="img-fluid object-fit-cover w-100 h-100 d-block"
                        src={getImgUrl('/images/home/comment-2.png')}
                        alt="comment-2"
                      />
                    </div>
                    <h3 className="fs-xs fs-md-h6 fw-bold">張大名</h3>
                  </div>
                  <p className="fs-sm tracking-sm fs-md-base">
                    上衣款式新穎，穿著非常舒適。洗滌後也不變形，是我衣櫥的新寵。
                  </p>
                </div>
              </div>
              <div className="col-md-6 col-lg-3">
                <div className="bg-nature-95 p-4 p-md-6 h-100">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="rounded-circle overflow-hidden w-24px h-24px w-md-40px h-md-40px">
                      <img
                        className="img-fluid object-fit-cover w-100 h-100 d-block"
                        src={getImgUrl('/images/home/comment-3.png')}
                        alt="comment-3"
                      />
                    </div>
                    <h3 className="fs-xs fs-md-h6 fw-bold">王芳</h3>
                  </div>
                  <p className="fs-sm tracking-sm fs-md-base">
                    這條洋裝太讚了！適合各種場合，穿起來很有氣質。朋友們都誇我眼光好。
                  </p>
                </div>
              </div>
              <div className="col-md-6 col-lg-3">
                <div className="bg-nature-95 p-4 p-md-6 h-100">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="rounded-circle overflow-hidden w-24px h-24px w-md-40px h-md-40px">
                      <img
                        className="img-fluid object-fit-cover w-100 h-100 d-block"
                        src={getImgUrl('/images/home/comment-4.png')}
                        alt="comment-4"
                      />
                    </div>
                    <h3 className="fs-xs fs-md-h6 fw-bold">林小美</h3>
                  </div>
                  <p className="fs-sm tracking-sm fs-md-base">
                    褲子的質地和做工都很棒，穿著舒適又耐穿。尤其適合辦公室穿搭，很專業。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
