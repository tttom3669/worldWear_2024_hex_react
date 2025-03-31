import { useNavigate } from 'react-router-dom';

import FrontHeader from '../../components/front/FrontHeader';
import CartFlow from '../../components/front/CartFlow';

export default function CheckoutSuccess() {
  const navigate = useNavigate();

  return (
    <>
      <FrontHeader defaultType={'light'} />
      <main>
        <div className="pt-5 pb-10 pt-md-12 pb-md-30">
          <CartFlow step={3} className={`mb-20`} />
          <div className="container">
            <div className="d-flex justify-content-center align-items-center">
              <div
                className="border border-dark p-5 text-center"
                style={{ maxWidth: '500px', width: '100%' }}
              >
                {/* 成功圖示與標題 */}
                <div className="mb-3">
                  <h3 className="mt-2 fw-bold">您已購買完成</h3>
                </div>

                {/* 訊息 */}
                <p className="text-muted">
                  感謝您的購買，詳細到貨日期請再訂單中查詢！
                </p>

                {/* 按鈕 */}
                <div className="d-flex justify-content-center gap-3 mt-4">
                  <button
                    onClick={() => navigate('/products')}
                    className="btn btn-outline-dark px-4"
                  >
                    繼續逛逛
                  </button>
                  <button
                    onClick={() => navigate('/user/order')}
                    className="btn btn-outline-dark px-4"
                  >
                    查看訂單紀錄
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
