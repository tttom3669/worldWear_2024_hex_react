import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import useImgUrl from '../../hooks/useImgUrl';

gsap.registerPlugin(ScrollTrigger);

export default function FrontFooter() {
  const getImgUrl = useImgUrl();
  const topBtnRef = useRef(null);
  const location = useLocation();
  const pathname = location.pathname;

  const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };
  const isLowerThanDvh = () => {
    // 取得目前視窗的高度
    const viewportHeight = window.innerHeight;
    // 取得整個文件（頁面）的高度
    const documentHeight = document.documentElement.scrollHeight;
    return documentHeight <= viewportHeight;
  };
  const checkShowTopButton = () => {
    if (topBtnRef.current) {
      // 滾動高度未超過 100vh，強制隱藏按鈕
      if (isLowerThanDvh()) {
        topBtnRef.current.classList.add('opacity-0', 'pe-none');
      }
    }
  };

  // GSAP 動畫設定
  const setupScrollTrigger = () => {
    const main = document.querySelector('main');
    const footer = document.querySelector('footer');
    if (!main || !footer) {
      return () => {};
    }

    // 清理所有 ScrollTrigger 實例，不只是與 main 相關的
    ScrollTrigger.getAll().forEach((trigger) => {
      trigger.kill();
    });

    // 確保 footer 高度正確
    const startValue = `bottom bottom-=${footer.offsetHeight - 32}px`;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: main,
        start: startValue,
        // markers: true,
        invalidateOnRefresh: true, // 確保 refresh 時重新計算所有值
        id: 'mainScrollTrigger', // 添加 ID 以便於識別和清理
        onEnter: () => {
          if (topBtnRef.current && !isLowerThanDvh()) {
            topBtnRef.current.classList.remove('opacity-0', 'pe-none');
          }
        },
        onLeaveBack: () => {
          if (topBtnRef.current && !isLowerThanDvh()) {
            topBtnRef.current.classList.add('opacity-0', 'pe-none');
          }
        },
      },
    });

    // 返回清理函數
    return () => {
      tl.kill();
      // 確保特定的 ScrollTrigger 被清理
      ScrollTrigger.getById('mainScrollTrigger')?.kill();
    };
  };

  useGSAP(() => {
    // 清理所有現有的 ScrollTrigger
    ScrollTrigger.getAll().forEach((trigger) => {
      trigger.kill();
    });

    // 然後設置新的 ScrollTrigger
    let cleanup = setupScrollTrigger();

    // 給予 Swiper 或其他動態內容一點時間載入和調整高度
    const refreshTimeout = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 1000);

    // 監聽螢幕尺寸變化，並在變化後重新初始化 ScrollTrigger
    const handleResize = debounce(() => {
      ScrollTrigger.refresh();
    }, 300);

    window.addEventListener('resize', handleResize);

    return () => {
      cleanup(); // 清理 GSAP timeline

      // 確保所有 ScrollTrigger 被清理
      ScrollTrigger.getAll().forEach((trigger) => {
        trigger.kill();
      });

      clearTimeout(refreshTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, [pathname]); // 依賴於 pathname，當路徑改變時重新執行

  useEffect(() => {
    if (topBtnRef.current) {
      topBtnRef.current.classList.add('opacity-0', 'pe-none');
      checkShowTopButton(); // 初始檢查
    }
  }, [pathname, checkShowTopButton]);

  return (
    <footer className="bg-black py-6 py-md-3">
      <Link
        className="c-topBtn opacity-0 pe-none"
        to="#"
        ref={topBtnRef}
        onClick={(e) => {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      >
        <div className="c-topBtn__icon">
          <svg className="pe-none" width="14" height="14">
            <use href={getImgUrl('/icons/top-arrow.svg#top-arrow')} />
          </svg>
        </div>
        TOP
      </Link>
      <div className="container">
        <div className="d-flex align-items-start align-items-md-center justify-content-between flex-column gap-3 flex-xl-row gap-xl-0">
          <div className="d-flex align-items-md-center flex-column gap-3 gap-lg-12 flex-lg-row">
            <Link to="/">
              <img
                className="footer__logo"
                src={getImgUrl('/images/home/logo-footer.png')}
                alt="logo"
              />
            </Link>
            <div className="d-flex align-items-start align-items-md-center flex-column gap-2 flex-lg-row gap-lg-0">
              {/* <ul className="d-flex align-items-center gap-2 text-white">
                  <li>
                    <Link className="footer__link" to="/">
                      代購流程
                    </Link>
                  </li>
                  <li>
                    <Link className="footer__link " to="/">
                      常見問題
                    </Link>
                  </li>
                  <li>
                    <Link className="footer__link " to="/">
                      聯繫我們
                    </Link>
                  </li>
                  <li>
                    <Link className="footer__link " to="/">
                      隱私權政策
                    </Link>
                  </li>
                </ul> */}
              <ul className="d-flex align-items-center px-md-2 py-md-3 gap-6">
                <li>
                  <Link to="/" className="footer__social">
                    <svg width="16" height="16">
                      <use href={getImgUrl('/icons/fb.svg#fb')}></use>
                    </svg>
                  </Link>
                </li>
                <li>
                  <Link to="/" className="footer__social">
                    <svg width="16" height="16">
                      <use href={getImgUrl('/icons/line.svg#line')}></use>
                    </svg>
                  </Link>
                </li>
                <li>
                  <Link to="/" className="footer__social">
                    <svg width="16" height="16">
                      <use href={getImgUrl('/icons/ig.svg#ig')}></use>
                    </svg>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div>
            <p className="text-white fs-sm tracking-none">
              Copyright © WorldWear all rights reserved
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
