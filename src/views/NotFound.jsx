import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FrontHeader from '../components/front/FrontHeader';
import FrontFooter from '../components/front/FrontFooter';

export default function NotFound() {
  const navigate = useNavigate();
  useEffect(() => {
    setTimeout(() => {
      navigate('/');
    }, 2000);
  }, [navigate]);
  return (
    <>
      <div className="site">
        <title>404 - WorldWear</title>
        <FrontHeader defaultType={'light'} />
        <main className="d-flex align-items-center justify-content-center">
          <h1
            className="font-dm-serif"
            style={{ fontSize: 'clamp(4rem,10vw,6.25rem)' }}
          >
            404
          </h1>
        </main>
        <FrontFooter />
      </div>
    </>
  );
}
