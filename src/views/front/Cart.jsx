import axios from 'axios';
import FrontHeader from '../../components/front/FrontHeader';
import CartFlow from '../../components/front/CartFlow';
import useImgUrl from '../../hooks/useImgUrl';
import { useEffect, useState } from 'react';
import useSwal from '../../hooks/useSwal';
import { useDispatch } from 'react-redux';
import { setCartsData } from '../../slice/cartsSlice';

const { VITE_API_PATH: API_PATH } = import.meta.env;

export default function Cart() {
  const getImgUrl = useImgUrl();
  const [tempCartsData, setTempCartsData] = useState([]);
  const [cartsTotal, setCartsTotal] = useState(0);
  const [tempCouponData, setTempCouponData] = useState('');
  const [couponData, setCouponData] = useState({});
  const { toastAlert } = useSwal();
  const dispatch = useDispatch();

  const couponHandler = async () => {
    try {
      const res = await axios.get(`${API_PATH}/coupons?code=${tempCouponData}`);
      toastAlert({ icon: 'success', title: '已套用優惠券代碼' });
      if (res.data.length <= 0) {
        throw new Error('No coupon data found');
      }
      setCouponData(res.data[0]);
    } catch (error) {
      setCouponData({});
      toastAlert({ icon: 'error', title: '輸入錯誤優惠券代碼' });
      console.log(error);
    }
  };

  const calDiscount = (total, percent) => {
    return percent ? (total * percent) / 100 : 0;
  };
  const getCarts = async () => {
    // const token = document.cookie.replace(
    //   /(?:(?:^|.*;\s*)worldWearToken\s*\=\s*([^;]*).*$)|^.*$/,
    //   '$1'
    // );
    const userId = document.cookie.replace(
      /(?:(?:^|.*;\s*)worldWearUserId\s*\=\s*([^;]*).*$)|^.*$/,
      '$1'
    );
    const res = await axios.get(
      `${API_PATH}/carts/?userId=${userId}&_expand=user&_expand=product`
    );
    setTempCartsData(res.data);
  };
  const updateCarts = async (cartId, qty) => {
    const method = qty <= 0 ? 'DELETE' : 'PATCH';
    const alertTitle = qty <= 0 ? '已從購物車中刪除' : '已更新購物車';
    const apiData = qty <= 0 ? {} : { qty };

    await axios({
      method,
      url: `${API_PATH}/carts/${cartId}`,
      data: apiData,
    });

    toastAlert({ icon: 'success', title: alertTitle });

    getCarts();
  };

  useEffect(() => {
    getCarts();
  }, []);

  useEffect(() => {
    const totalPrice = tempCartsData
      .map((cart) => cart.product.price * cart.qty)
      .reduce((accVal, curVal) => accVal + curVal, 0);

    setCartsTotal(totalPrice);

    dispatch(
      setCartsData({
        total: totalPrice,
        final_total: totalPrice - calDiscount(totalPrice, couponData?.percent),
        products: [...tempCartsData],
      })
    );
  }, [tempCartsData, couponData]);

  return (
    <>
      <FrontHeader defaultType={'light'} />
      <main>
        <div className="pt-5 pb-10 pt-md-12 pb-md-30">
          <CartFlow step={1} className={`mb-10`} />
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div>
                  <h1 className="mb-5 fw-bold fs-h5">購物車</h1>

                  <div className="cart__table mb-5">
                    <div className="cart__thead px-3">
                      <div>商品資料</div>
                      <div>單價</div>
                      <div>數量</div>
                      <div>小計</div>
                    </div>
                    <div className="cart__tbody">
                      {tempCartsData.map((cart) => (
                        <div
                          className="pt-3 pb-5 px-lg-3 py-lg-4"
                          key={cart.id}
                        >
                          <img
                            className="cart__product-img mb-3 mb-lg-0"
                            src={cart.product.imageUrl}
                            alt={cart.product.title}
                          />
                          <div className="cart__product-content mb-3 px-lg-3 py-lg-4.5 mb-lg-0">
                            <p className="mb-lg-4">{cart.product.title}</p>
                            <p>
                              規格：{cart.color}/{cart.size}
                            </p>
                          </div>

                          <div className="cart__product-price mb-3 md-lg-0">
                            <span className="mb-1">
                              ${cart.product.price.toLocaleString('zh-TW')}
                            </span>
                            <span className="text-decoration-line-through text-nature-70">
                              $
                              {cart.product.origin_price.toLocaleString(
                                'zh-TW'
                              )}
                            </span>
                          </div>
                          <div className="cart__product-num py-1.5 py-lg-0">
                            <div className="c-product-num">
                              <button
                                className="btn c-product-num__minus"
                                type="button"
                                onClick={() =>
                                  updateCarts(cart.id, cart.qty - 1)
                                }
                              >
                                <svg className="pe-none" width="24" height="24">
                                  <use
                                    href={getImgUrl('/icons/minus.svg#minus')}
                                  />
                                </svg>
                              </button>
                              <input
                                type="text"
                                className="form-control c-product-num__val"
                                value={cart.qty}
                                readOnly
                              />
                              <button
                                className="btn c-product-num__plus"
                                type="button"
                                onClick={() =>
                                  updateCarts(cart.id, cart.qty + 1)
                                }
                              >
                                <svg className="pe-none" width="24" height="24">
                                  <use
                                    href={getImgUrl('/icons/plus.svg#plus')}
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                          <div className="cart__product-total">
                            <p>
                              $
                              {(cart.product.price * cart.qty).toLocaleString(
                                'zh-TW'
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border-bottom border-nature-90 pb-5 mb-5">
                    <div className="d-flex flex-column justify-content-between pb-3 p-md-3 flex-md-row">
                      <div className="d-flex flex-column mb-3 mb-md-0">
                        <div className="d-flex justify-content-end justify-content-md-start">
                          <div className="cart__discount mb-3">
                            <input
                              type="text"
                              className="form-control cart__discount-input"
                              placeholder="請輸入折價券"
                              value={tempCouponData}
                              onChange={(e) =>
                                setTempCouponData(e.target.value)
                              }
                            />
                            <button
                              className="btn btn-outline-primary cart__discount-btn"
                              type="button"
                              onClick={couponHandler}
                              disabled={tempCouponData === ''}
                            >
                              使用
                            </button>
                          </div>
                        </div>
                        {couponData?.title && (
                          <div className="d-flex justify-content-end justify-content-md-start">
                            <p className="bg-secondary-80 border border-secondary-70 fs-sm rounded-1 px-2 py-1">
                              商品適用優惠：{couponData.title}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="d-flex flex-column gap-2 gap-md-4">
                        <div className="d-flex justify-content-end gap-6">
                          <p>商品金額</p>
                          <p>${cartsTotal.toLocaleString('zh-TW')}</p>
                        </div>
                        {couponData?.percent && (
                          <div className="d-flex justify-content-end gap-6">
                            <p>折扣碼折抵</p>
                            <p className="text-secondary-60">
                              ${calDiscount(cartsTotal, couponData?.percent)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-end gap-6">
                      <p>
                        <span className="fw-bold">{tempCartsData.length}</span>
                        項商品
                      </p>
                      <p className="fw-bold fs-h4">
                        $
                        {(
                          cartsTotal -
                          calDiscount(cartsTotal, couponData?.percent)
                        ).toLocaleString('zh-TW')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="d-flex flex-column-reverse justify-content-end align-items-center gap-3 mb-10 flex-sm-row gap-md-6 mb-md-30">
                  <input
                    type="button"
                    className="btn btn-lg btn-outline-primary"
                    value="繼續逛逛"
                  />
                  <input
                    type="button"
                    className="btn btn-lg btn-primary"
                    value="前往結賬"
                  />
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-lg-8 offset-lg-1 col-xxl-7">
                <div className="d-flex flex-column gap-4 border border-nature-90 rounded-3 p-6">
                  <h2 className="fs-base fw-bold">購買說明</h2>
                  <p className="text-nature-40 fs-sm tracking-none">
                    我們承諾所售商品均為正品，並來自經過嚴格篩選的供應商。若您對商品的真偽有任何疑問，請立即聯繫我們。
                  </p>
                  <h2 className="fs-base fw-bold">退換貨說明</h2>
                  <ul
                    className="text-nature-40 fs-sm ps-4"
                    style={{ listStyleType: '"·"' }}
                  >
                    <li className="tracking-none">
                      因海外訂單配送歷程繁瑣，因此無法提供退換貨服務，請您選購商品時，務必謹慎確認訂單內容商品及數量，跨國商品不接受任何原因的退換貨。
                    </li>
                    <li className="tracking-none">
                      若拒絕簽收包裹、收件資訊不正確導致無法配送、無人簽收等個人因素導致包裹退回，我們將直接取消整筆訂單。退款金額須扣除實際產生之來回運費，再退回原訂單餘額。
                    </li>
                  </ul>
                  <h2 className="fs-base fw-bold">付款說明</h2>
                  <ul
                    className="text-nature-40 fs-sm ps-4"
                    style={{ listStyleType: '"·"' }}
                  >
                    <li>
                      商品價格以顯示的貨幣為準，若使用其他貨幣付款，請注意匯率可能會影響最終支付金額。
                    </li>
                  </ul>

                  <p className="fs-sm text-nature-70 tracking-non text-xxl-nowrap">
                    *Worldwear
                    保有最終修改、變更、活動解釋及取消活動之權利，若有相關異動將會公告於網站，恕不另行通知。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
