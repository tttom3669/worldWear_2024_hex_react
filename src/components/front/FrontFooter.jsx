import { Link } from 'react-router-dom';

import useImgUrl from '../../hooks/useImgUrl';

export default function FrontFooter() {
  const getImgUrl = useImgUrl();
  return (
    <footer className="bg-black py-3">
      <a className="topBtn pe-none opacity-0" href="#">
        <img src="/assets/images/topBtn.png" alt="top" />
      </a>
      <div className="container">
        <div className="d-flex align-items-center justify-content-between flex-column gap-10 flex-xl-row gap-xl-0">
          <div className="d-flex align-items-center flex-column gap-6 gap-lg-12 flex-lg-row">
            <Link to="/">
              <img
                className="footer__logo"
                src={getImgUrl('/images/home/logo-footer.png')}
                alt="logo"
              />
            </Link>
            <div className="d-flex align-items-center flex-column gap-6 flex-lg-row gap-lg-0">
              <ul className="d-flex flex-column align-items-center gap-2 text-white flex-sm-row">
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
              <ul className="d-flex align-items-center px-2 py-3 gap-6">
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
