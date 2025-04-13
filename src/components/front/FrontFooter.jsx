import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import useImgUrl from '../../hooks/useImgUrl';

gsap.registerPlugin(ScrollTrigger);

export default function FrontFooter() {
  const getImgUrl = useImgUrl();
  const topBtnRef = useRef(null);

  // debounce 函數
  const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  // GSAP 動畫設定
  const setupScrollTrigger = () => {
    const main = document.querySelector('main');
    const footer = document.querySelector('footer');
    if (!main) {
      return;
    }

    const startValue = `bottom bottom-=${footer.offsetHeight - 32}px`;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: main,
        start: startValue,
        // markers: true,
        invalidateOnRefresh: true, // 確保 refresh 時重新計算所有值
        onEnter: () => {
          if (topBtnRef.current) {
            topBtnRef.current.classList.remove('opacity-0', 'pe-none');
          }
        },
        onLeaveBack: () => {
          if (topBtnRef.current) {
            topBtnRef.current.classList.add('opacity-0', 'pe-none');
          }
        },
      },
    });

    // 返回清理函數
    return () => {
      tl.kill();
    };
  };

  useGSAP(() => {
    const cleanup = setupScrollTrigger();

    // 給予 Swiper 或其他動態內容一點時間載入和調整高度
    const refreshTimeout = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 1000);

    // 監聽螢幕尺寸變化，並在變化後重新初始化 ScrollTrigger
    const handleResize = debounce(() => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill()); // 清理所有 ScrollTrigger
      setupScrollTrigger(); // 重新初始化
      ScrollTrigger.refresh(); // 刷新 ScrollTrigger
    }, 300);

    window.addEventListener('resize', handleResize);

    return () => {
      cleanup(); // 清理 GSAP timeline
      clearTimeout(refreshTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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
