import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { productCategories as productCategoriesData } from '../../slice/productsSlice';
import useImgUrl from '../../hooks/useImgUrl';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { checkLogin } from '../../slice/authSlice';
import {
  asyncGetCarts,
  cartsData as sliceCartsData,
} from '../../slice/cartsSlice';
// 搜尋功能。 等產品頁面，才來實作

function FrontHeader({ defaultType }) {
  const getImgUrl = useImgUrl();
  const dispatch = useDispatch();
  const [headerType, setHeaderType] = useState('');
  const [isHeaderScroll, setIsHeaderScroll] = useState(false);
  const [menuData, setMenuData] = useState({ isOpen: false });
  const [isLogin, setIsLogin] = useState(false);
  const navigate = useNavigate();
  const headerRef = useRef(null);
  const productCategories = useSelector(productCategoriesData);
  const cartsData = useSelector(sliceCartsData);

  gsap.registerPlugin(ScrollTrigger);
  gsap.registerPlugin(useGSAP);

  const [isInitialized, setIsInitialized] = useState(false);
  const auth = useSelector((state) => state.authSlice);

  // 初始化認證狀態 - 使用 checkLogin action
  useEffect(() => {
    // 檢查用戶是否已登入
    dispatch(checkLogin());
    setIsInitialized(true);
    dispatch(asyncGetCarts());
  }, [dispatch]);

  // 更新登入狀態
  useEffect(() => {
    if (isInitialized) {
      const loggedIn = auth.status === 'logged-in' && auth.user !== null;
      setIsLogin(loggedIn);

      if (loggedIn) {
        console.log('FrontHeader: 用戶已登入');
      }
    }
  }, [isInitialized, auth.status, auth.user]);

  useEffect(() => {
    setHeaderType(defaultType);
  }, [defaultType]);

  useGSAP(() => {
    gsap.timeline({
      scrollTrigger: {
        trigger: headerRef.current,
        start: 'top top',
        end: 'bottom top',
        // markers: true,
        onEnter: () => {
          setIsHeaderScroll(true);
        },
        onLeaveBack: () => {
          setIsHeaderScroll(false);
        },
      },
    });
  });

  const isDesktop = () => {
    return window.innerWidth > 992;
  };

  function mainMenuHandler(e) {
    e.preventDefault();
    const name = e.target.name || e.target.parentElement.name;
    setMenuData({
      type: name,
      isOpen: name !== menuData.type ? true : !menuData.isOpen,
    });
  }

  return (
    <>
      <aside className="position-relative relative bg-primary-80 py-1 py-lg-3 text-center fs-sm fw-bold z-1">
        與世界共舞，與時尚同步 - WorldWear
      </aside>
      <header
        className={`header ${isLogin ? 'header--login' : 'header--logout'}
        ${
          isHeaderScroll
            ? 'header--scroll'
            : headerType === 'dark'
            ? 'header--dark'
            : 'header--light'
        }
        ${menuData.isOpen ? 'isOpen' : ''}`}
        ref={headerRef}
        onMouseLeave={() => setMenuData({ ...menuData, isOpen: false })}
      >
        <nav className="navbar navbar-expand-lg">
          <div className="container">
            <div className="d-flex justify-content-lg-between align-items-center w-100">
              <div className="d-flex align-items-center gap-lg-12 flex-fill">
                <Link className="text-reset me-auto m-lg-0" to="/">
                  <h1 className="d-flex">
                    <svg className="l-logo" width="120" height="72">
                      <use href={getImgUrl('/icons/Logo.svg#logo')}></use>
                    </svg>
                  </h1>
                </Link>
                <ul className="navbar-nav l-menu">
                  {productCategories.map((gender) => (
                    <li className="nav-item dropdown" key={gender.slug}>
                      <NavLink
                        to={`/products/${gender.slug}`}
                        name={gender.slug}
                        onClick={(e) => mainMenuHandler(e)}
                        className={`l-menu__link ${
                          menuData.type === gender.slug && menuData.isOpen
                            ? 'active'
                            : ''
                        }`}
                      >
                        {gender.title[0].toUpperCase() + gender.title.slice(1)}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="d-flex">
                <div className="position-lg-relative d-flex align-items-center">
                  <div
                    className={`header__searchBar-container ${
                      menuData.type === 'search' && menuData.isOpen
                        ? 'show'
                        : ''
                    }`}
                  >
                    <div className="container px-lg-0">
                      <form className="d-flex w-100 w-lg-auto" role="search">
                        <input
                          className="form-control header__searchBar w-100 w-lg-auto"
                          type="search"
                          placeholder="Search"
                          aria-label="Search"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              navigate(`/search/?s=${e.target.value}`);
                            }
                          }}
                        />
                      </form>
                    </div>
                  </div>
                  <button
                    type="button"
                    name="search"
                    onClick={(e) => mainMenuHandler(e)}
                    className={`header__searchIcon border-0 bg-transparent justify-content-center align-items-center p-3 p-lg-0  ${
                      menuData.type === 'search' &&
                      menuData.isOpen &&
                      isDesktop()
                        ? 'd-none'
                        : 'd-flex'
                    }`}
                  >
                    <svg width="16" height="16" className="pe-none">
                      <use href={getImgUrl('/icons/search.svg#search')}></use>
                    </svg>
                  </button>
                </div>
                <div className="ms-6 d-none d-lg-block">
                  <div className="header--login__item">
                    <ul className="d-flex gap-6">
                      <li className="d-flex justify-content-center align-items-center">
                        <Link
                          className="position-relative d-flex text-reset"
                          to="/cart"
                        >
                          <svg width="16" height="16">
                            <use href={getImgUrl('/icons/cart.svg#cart')}></use>
                          </svg>
                          <span className="header__cart-badge d-flex justify-content-center align-items-center position-absolute top-0 start-100 translate-middle  rounded-circle bg-danger text-white fs-xxs">
                            {cartsData?.products.length}
                          </span>
                        </Link>
                      </li>
                      <li className="d-flex justify-content-center align-items-center">
                        <Link
                          to="/user/favorites"
                          className=" text-reset header__heart d-flex"
                        >
                          <svg width="16" height="16">
                            <use
                              href={getImgUrl('/icons/heart.svg#heart')}
                            ></use>
                          </svg>
                        </Link>
                      </li>
                      <li>
                        <Link to="/user">
                          <img
                            src={getImgUrl('/images/shared/user.png')}
                            alt="user"
                            width="24"
                            height="24"
                          />
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
                <div
                  className={`l-menu__collapse ${
                    menuData.type === 'user' && menuData.isOpen ? 'show' : ''
                  }`}
                >
                  <ul className="navbar-nav l-menu header--logout__item ">
                    <li>
                      <Link
                        className="l-menu__link"
                        to="/login"
                        state={{ activeTab: 'login' }}
                      >
                        登入
                      </Link>
                    </li>
                    <li>
                      <Link
                        className="l-menu__link"
                        to="/login"
                        state={{ activeTab: 'register' }}
                      >
                        註冊
                      </Link>
                    </li>
                  </ul>
                  <ul className="navbar-nav l-menu d-lg-none header--login__item">
                    <li>
                      <Link className="nav-link l-menu__link" to="/cart">
                        購物車
                      </Link>
                    </li>
                    <li>
                      <Link className="nav-link l-menu__link" to="/favorites">
                        收藏清單
                      </Link>
                    </li>
                    <li>
                      <Link className="nav-link l-menu__link" to="/user">
                        會員中心
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => mainMenuHandler(e)}
                name="user"
                className="l-menu__collapse-btn border-0 bg-transparent p-2 <%= (mode==='login' ) ? 'l-menu__collapse-btn--login' : '' %>"
              >
                <div className="header--logout__item">
                  <svg className="pe-none" width="24" height="24">
                    <use href={getImgUrl('/icons/list.svg#list')}></use>
                  </svg>
                  <svg className="pe-none d-none" width="24" height="24">
                    <use href={getImgUrl('/icons/close.svg#close')}></use>
                  </svg>
                </div>
                <img
                  className="header--login__item"
                  src={getImgUrl('/images/shared/user.png')}
                  alt="user"
                  width="24"
                  height="24"
                />
              </button>
            </div>
          </div>

          {productCategories.map((gender) => (
            <div
              key={gender.slug}
              className={`l-menu__dropdown ${
                menuData.type === gender.slug && menuData.isOpen ? 'show' : ''
              }`}
            >
              <div className="container">
                <ul className="l-menu__dropdown-menu">
                  <li>
                    <Link
                      className="l-menu__dropdown-link"
                      to={`/products/${gender.slug}`}
                    >
                      所有商品
                    </Link>
                  </li>
                  {/* {gender.categories.map((category) => (
                    <li key={category.slug}>
                      <Link
                        className="l-menu__dropdown-link"
                        to={`/products/${gender.slug}/${category.slug}`}
                      >
                        {category.title}
                      </Link>
                    </li>
                  ))} */}
                  {gender.categories
                    .filter((category) => category.slug !== 'product-status')
                    .map((category) => (
                      <li key={category.slug}>
                        <Link
                          className="l-menu__dropdown-link"
                          to={`/products/${gender.slug}/${category.slug}`}
                        >
                          {category.title}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          ))}
        </nav>
      </header>
    </>
  );
}

FrontHeader.propTypes = {
  defaultType: PropTypes.string,
};

export default FrontHeader;
