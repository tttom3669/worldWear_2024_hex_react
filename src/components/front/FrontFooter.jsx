import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

import useImgUrl from '../../hooks/useImgUrl';
import { useRef } from 'react';

export default function FrontFooter() {
  const getImgUrl = useImgUrl();
  const topBtnRef = useRef(null);
  gsap.registerPlugin(ScrollTrigger);
  gsap.registerPlugin(useGSAP);

  useGSAP(() => {
    const main = document.querySelector('main');
    gsap.timeline({
      scrollTrigger: {
        trigger: main,
        start: '80% 70%',
        // markers: true,
        onEnter: () => {
          // 向下滾動到達時移除 class
          topBtnRef.current.classList.remove('opacity-0');
          topBtnRef.current.classList.remove('pe-none');
        },
        onLeaveBack: () => {
          // 向上滾動回來時添加 class
          topBtnRef.current.classList.add('opacity-0');
          topBtnRef.current.classList.add('pe-none');
        },
      },
    });
  });
  return (
    <footer className="bg-black py-6 py-md-3">
      <Link
        className="c-topBtn opacity-0 pe-none"
        to="#"
        ref={topBtnRef}
        onClick={() => {
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
              <ul className="d-flex align-items-center gap-2 text-white">
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
              </ul>
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
