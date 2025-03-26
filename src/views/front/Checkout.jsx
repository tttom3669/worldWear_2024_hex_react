import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';

import FrontHeader from '../../components/front/FrontHeader';
import CartFlow from '../../components/front/CartFlow';
import FormTitle from '../../components/front/FormTitle';
import ScreenLoading from '../../components/front/ScreenLoading';
import useImgUrl from '../../hooks/useImgUrl';
const { VITE_API_PATH: API_PATH } = import.meta.env;

export default function Checkout() {
  const getImgUrl = useImgUrl();
  const navigate = useNavigate();
  const user = useSelector((state) => state.authSlice.user);
  const carts = useSelector((state) => state.carts.cartsData);
  const [isLoading, setIsLoading] = useState(false);

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  };

  const userCheckout = async () => {
    try {
      setIsLoading(true);
      const orderData = {
        is_paid: true,
        status: '未出貨',
        products: carts.products,
        orderDate: formatDate(new Date()),
        paymentInfo: {
          totalAmount: carts.total,
          discount: carts.total - carts.final_total,
          paymentMethod: '信用卡一次付款',
        },
        deliveryInfo: {
          recipient: '王小明',
          deliveryMethod: '宅配',
          address: '桃園市中壢區中和路139號',
          phone: '0975664552',
        },
        invoiceInfo: {
          invoiceType: '電子發票',
          carrier: '會員載具',
        },
        total: carts.total,
        final_total: carts.final_total,
        userId: user.id,
      };
      await axios.post(`${API_PATH}/orders`, orderData);
      setTimeout(() => {
        setIsLoading(false);
        navigate('/checkout-success');
      }, 1000);
    } catch (error) {
      console.log(error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('有token:', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  // useEffect(() => {
  //   console.log('cart', carts);
  // }, [carts]);

  return (
    <>
      <title>結帳資訊</title>
      <FrontHeader defaultType={'light'} />
      <main>
        <div className="pt-5 pb-10 pt-md-12 pb-md-30">
          <CartFlow step={2} className={`mb-10`} />
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-md-7">
                {/* 訂購人資訊 */}
                <div className="mb-8">
                  <FormTitle
                    title="訂購人資訊"
                    borderColor={`border-nature-90`}
                    titleBgColor={`bg-nature-90`}
                  />
                  <div className="px-5 py-8 bg-white border border-nature-90">
                    {/* 姓名 */}
                    <div className="d-flex align-items-center mb-3">
                      <label className="form-label form-label-text me-6">
                        姓名
                      </label>
                      <input
                        type="text"
                        className="form-control form-input bg-white"
                        defaultValue="王小明"
                      />
                    </div>

                    {/* 手機 */}
                    <div className="d-flex align-items-center mb-3">
                      <label className="form-label form-label-text me-6">
                        手機
                      </label>
                      <input
                        type="text"
                        className="form-control form-input bg-white"
                        defaultValue="0975664552"
                      />
                    </div>

                    {/* EMAIL */}
                    <div className="d-flex align-items-center mb-3">
                      <label className="form-label form-label-text me-6">
                        EMAIL
                      </label>
                      <input
                        type="email"
                        className="form-control form-input bg-white"
                        defaultValue="xiaojming@gmail.com"
                      />
                    </div>
                  </div>
                </div>

                {/* 收件方式 */}
                <div className="mb-8">
                  <FormTitle
                    title="收件方式"
                    borderColor={`border-nature-90`}
                    titleBgColor={`bg-nature-90`}
                  />
                  <div className="px-5 py-8 bg-white border border-nature-90">
                    <div className="form-check mb-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="sameAsBuyer"
                        defaultChecked
                      />
                      <label className="form-check-label" htmlFor="sameAsBuyer">
                        收貨人同訂購人
                      </label>
                    </div>
                    <div className="d-flex align-items-center mb-3">
                      <label className="form-label form-label-text me-6">
                        收貨人
                      </label>
                      <input
                        type="text"
                        className="form-control form-input bg-white"
                        defaultValue="王小明"
                      />
                    </div>
                    <div className="d-flex align-items-center mb-3 pb-3 border-bottom border-nature-90">
                      <label className="form-label form-label-text me-6">
                        手機
                      </label>
                      <input
                        type="text"
                        className="form-control form-input bg-white"
                        defaultValue="0975664552"
                      />
                    </div>
                    <div className="d-flex align-items-center gap-4 mb-3">
                      <div className="custom-radio">
                        <input
                          type="radio"
                          id="storePickup"
                          name="shipping"
                          className="form-check-input"
                        />
                        <label
                          className="form-check-label ms-2"
                          htmlFor="storePickup"
                        >
                          超商取貨
                        </label>
                      </div>
                      <div className="custom-radio">
                        <input
                          defaultChecked
                          type="radio"
                          id="homeDelivery"
                          name="shipping"
                          className="form-check-input"
                        />
                        <label
                          className="form-check-label ms-2"
                          htmlFor="homeDelivery"
                        >
                          宅配
                        </label>
                      </div>
                    </div>
                    <div className="row align-items-center">
                      <label className="form-label form-label-text">
                        宅配地址
                      </label>
                      <div className="col-md-3">
                        <select className="form-select bg-white">
                          <option>桃園市</option>
                          <option>台北市</option>
                          <option>新北市</option>
                        </select>
                      </div>

                      <div className="col-md-3">
                        <select className="form-select bg-white">
                          <option>中壢區</option>
                          <option>大安區</option>
                          <option>信義區</option>
                        </select>
                      </div>

                      <div className="col-md-3">
                        <input
                          type="text"
                          className="form-control"
                          value="320"
                          disabled
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <input
                        type="text"
                        className="form-control form-input"
                        placeholder="詳細地址"
                        defaultValue="中和路139號"
                      />
                    </div>
                  </div>
                </div>

                {/* 付款方式 */}
                <div className="mb-8">
                  <FormTitle
                    title="付款方式"
                    borderColor={`border-nature-90`}
                    titleBgColor={`bg-nature-90`}
                  />
                  <div className="px-5 py-8 bg-white border border-nature-90">
                    <div className="custom-radio d-flex mb-3">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="payment"
                        id="creditCard"
                        defaultChecked
                      />
                      <label className="form-check-label" htmlFor="creditCard">
                        信用卡
                      </label>
                      <img
                        src={getImgUrl('/images/checkout/ic_visa.png')}
                        alt="ic_visa"
                        className="ms-2"
                        width="30"
                      />
                      <img
                        src={getImgUrl('/images/checkout/ic_master.png')}
                        alt="ic_master"
                        className="ms-2"
                        width="30"
                      />
                      <img
                        src={getImgUrl('/images/checkout/ic_jcb.png')}
                        alt="ic_jcb"
                        className="ms-2"
                        width="30"
                      />
                    </div>
                    <div className="d-flex align-items-center mb-3">
                      <label className="form-label form-label-text">
                        卡號*
                      </label>
                      <input
                        type="text"
                        className="form-control  form-input"
                        defaultValue="092091209128"
                      />
                    </div>
                    <div className="d-flex align-items-center mb-3">
                      <label className="form-label form-label-text">
                        有效期限*
                      </label>
                      <input
                        type="text"
                        className="form-control  form-input"
                        defaultValue="08/30"
                      />
                    </div>
                    <div className="d-flex align-items-center mb-3">
                      <label className="form-label form-label-text">
                        卡片後三碼*
                      </label>
                      <input
                        type="text"
                        className="form-control  form-input"
                        defaultValue="801"
                      />
                    </div>
                  </div>
                </div>

                {/* 發票選項 */}
                <div className="">
                  <FormTitle
                    title="發票選項"
                    borderColor={`border-nature-90`}
                    titleBgColor={`bg-nature-90`}
                  />
                  <div className="px-5 py-8 bg-white border border-nature-90">
                    <div className="form-check mb-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="invoiceData"
                        defaultChecked
                      />
                      <label className="form-check-label" htmlFor="invoiceData">
                        帶入上次結帳資料
                      </label>
                    </div>
                    <div className="mb-3">
                      <label className="form-label form-label-text">
                        發票類型
                      </label>
                      <select className="form-select bg-white">
                        <option>電子發票</option>
                        <option>紙本發票</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label form-label-text">
                        發票載具
                      </label>
                      <select className="form-select bg-white">
                        <option>存入會員載具，中獎後通知</option>
                        <option>手機條碼載具</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* 結帳明細 */}
              <div className="col-md-3">
                <div className="border">
                  <FormTitle
                    title="結帳明細"
                    borderColor={`border-nature-90 border-1`}
                    titleBgColor="bg-white text-nature-10 py-4"
                  />
                  <div className="bg-white p-4">
                    <div className="d-flex justify-content-between">
                      <span>商品原價金額</span>
                      <span className="fw-bold">NT {carts.total}</span>
                    </div>
                    <div className="d-flex justify-content-between mt-2">
                      <span>結帳金額</span>
                      <span className="fw-bold text-danger">
                        NT {carts.final_total}
                      </span>
                    </div>
                    <button
                      onClick={userCheckout}
                      className="btn btn-warning w-100 mt-3"
                    >
                      確認付款
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <ScreenLoading isLoading={isLoading} />
    </>
  );
}
