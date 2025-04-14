import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';

import FrontHeader from '../../components/front/FrontHeader';
import CartFlow from '../../components/front/CartFlow';
import FormTitle from '../../components/front/FormTitle';
import ScreenLoading from '../../components/front/ScreenLoading';
import useImgUrl from '../../hooks/useImgUrl';
import { useForm } from 'react-hook-form';
import AddressForm from '../../components/front/AddressForm';
const { VITE_API_PATH: API_PATH } = import.meta.env;

export default function Checkout() {
  const getImgUrl = useImgUrl();
  const navigate = useNavigate();
  const user = useSelector((state) => state.authSlice.user);
  const carts = useSelector((state) => state.carts.cartsData);
  const [lastOrder, setLastOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  };

  // 會員資料修改表單的 useForm
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    getValues,
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      shipping: '宅配', // 預設選擇宅配
      payment: '信用卡', // 預設選擇信用卡
      athleteBarcode: '/TESTEST', // 預設手機載具條碼
      companyTitle: '測試服飾貿易有限公司', // 預設公司抬頭
      companyId: '12345678', // 預設公司統編
    },
  });

  const onSubmit = async (data) => {
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
          paymentMethod: data.payment,
        },
        deliveryInfo: {
          recipient: data.deliveryName,
          deliveryMethod: data.shipping,
          address:
            shippingType === '宅配'
              ? data.county + data.region + data.address
              : data.storePickup,
          phone: data.deliveryPhone,
        },
        invoiceInfo: {
          invoiceType: data.invoiceType,
          carrier: data.carrier,
          athleteBarcode: data.athleteBarcode,
          companyTitle: data.companyTitle,
          companyId: data.companyId,
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
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      setIsLoading(false);
    }
  };

  const getLastOrder = async () => {
    const res = await axios.get(`${API_PATH}/orders`);
    if (!res.data.length) return;
    setLastOrder(res.data[res.data.length - 1]);
  };

  const paymentMethod = watch('payment');
  const shippingType = watch('shipping');
  const invoiceType = watch('invoiceType');
  const carrierType = watch('carrier');

  const handleSameAsBuyer = (e) => {
    if (!e.target.checked) {
      return;
    }
    const formValues = getValues();
    const buyerName = formValues.buyerName;
    const buyerPhone = formValues.buyerPhone;
    const payment = formValues.payment;
    const shipping = formValues.shipping;
    const invoiceType = formValues.invoiceType;
    const athleteBarcode = formValues.athleteBarcode;
    const companyTitle = formValues.companyTitle;
    const companyId = formValues.companyId;
    const carrier = formValues.carrier;

    reset({
      deliveryName: buyerName,
      deliveryPhone: buyerPhone,
      payment: payment,
      shipping: shipping,
      invoiceType: invoiceType,
      athleteBarcode: athleteBarcode,
      companyTitle: companyTitle,
      companyId: companyId,
      carrier: carrier,
    });
  };
  const handleLastInvoiceInfo = (e) => {
    if (!e.target.checked) {
      return;
    }
    const formValues = getValues();
    const buyerName = formValues.buyerName;
    const buyerPhone = formValues.buyerPhone;
    const payment = formValues.payment;
    const shipping = formValues.shipping;
    const invoiceType = lastOrder.invoiceInfo.invoiceType;
    const athleteBarcode = lastOrder.invoiceInfo.athleteBarcode;
    const companyTitle = lastOrder.invoiceInfo.companyTitle;
    const companyId = lastOrder.invoiceInfo.companyId;
    const carrier = lastOrder.invoiceInfo.carrier;

    reset({
      deliveryName: buyerName,
      deliveryPhone: buyerPhone,
      payment: payment,
      shipping: shipping,
      invoiceType: invoiceType,
      carrier: carrier,
      athleteBarcode: athleteBarcode,
      companyTitle: companyTitle,
      companyId: companyId,
    });
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  useEffect(() => {
    if (carts.final_total === 0) {
      navigate('/cart');
    }
  }, [carts.final_total, navigate]);

  useEffect(() => {
    getLastOrder();
  }, []);

  return (
    <>
      <title>結帳資訊</title>
      <FrontHeader defaultType={'light'} />
      <main>
        <div className="pt-5 pb-10 pt-md-12 pb-md-30">
          <CartFlow step={2} className={`mb-10`} />
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="container">
              <div className="row justify-content-center">
                <div className="col-lg-7">
                  {/* 訂購人資訊 */}
                  <div className="mb-8">
                    <FormTitle
                      title="訂購人資訊"
                      borderColor={`border-nature-90`}
                      titleBgColor={`bg-nature-90`}
                    />
                    <div className="px-5 py-8 bg-white border border-nature-90">
                      {/* 姓名 */}
                      <div className="d-flex flex-column mb-3 flex-md-row">
                        <label className="form-label form-label-text me-6">
                          姓名*
                        </label>
                        <div className="checkout__col">
                          <input
                            type="text"
                            className={`form-control  w-100 form-input bg-white ${
                              errors.buyerName && 'is-invalid'
                            }`}
                            placeholder="請輸入訂購人姓名"
                            {...register('buyerName', {
                              required: {
                                value: true,
                                message: '請輸入訂購人姓名',
                              },
                            })}
                          />
                          <p className="invalid-feedback">
                            {errors.buyerName?.message}
                          </p>
                        </div>
                      </div>

                      {/* 手機 */}
                      <div className="d-flex flex-column mb-3 flex-md-row">
                        <label className="form-label form-label-text me-6">
                          手機*
                        </label>
                        <div className="checkout__col">
                          <input
                            type="text"
                            className={`form-control  w-100 form-input bg-white ${
                              errors.buyerPhone && 'is-invalid'
                            }`}
                            placeholder="請輸入訂購人手機號碼"
                            {...register('buyerPhone', {
                              required: {
                                value: true,
                                message: '請輸入訂購人手機號碼',
                              },
                              pattern: {
                                value: /^(0[2-8]\d{7}|09\d{8})$/,
                                message: '電話格式不正確',
                              },
                              minLength: {
                                value: 8,
                                message: '電話不少於 8 碼',
                              },
                            })}
                          />
                          <p className="invalid-feedback">
                            {errors.buyerPhone?.message}
                          </p>
                        </div>
                      </div>

                      {/* EMAIL */}
                      <div className="d-flex flex-column mb-3 flex-md-row">
                        <label className="form-label form-label-text me-6">
                          EMAIL*
                        </label>
                        <div className="checkout__col">
                          <input
                            type="email"
                            className={`form-control  w-100 form-input bg-white ${
                              errors.buyerEmail && 'is-invalid'
                            }`}
                            placeholder="請輸入訂購人電子郵件"
                            {...register('buyerEmail', {
                              required: {
                                value: true,
                                message: '請輸入訂購人電子郵件',
                              },
                              pattern: {
                                value:
                                  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$/,
                                message: '請輸入正確的電子郵件',
                              },
                            })}
                          />
                          <p className="invalid-feedback">
                            {errors.buyerEmail?.message}
                          </p>
                        </div>
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
                          onClick={handleSameAsBuyer}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="sameAsBuyer"
                        >
                          收貨人同訂購人
                        </label>
                      </div>
                      <div className="d-flex flex-column mb-3 flex-md-row">
                        <label className="form-label form-label-text me-6">
                          收貨人*
                        </label>
                        <div className="checkout__col">
                          <input
                            type="text"
                            className={`form-control w-100 form-input bg-white ${
                              errors.deliveryName && 'is-invalid'
                            }`}
                            placeholder="請輸入訂購人姓名"
                            {...register('deliveryName', {
                              required: {
                                value: true,
                                message: '請輸入收貨人姓名',
                              },
                            })}
                          />
                          <p className="invalid-feedback">
                            {errors.deliveryName?.message}
                          </p>
                        </div>
                      </div>
                      <div className="d-flex flex-column pb-6 mb-8 flex-md-row  pb-md-3 border-bottom border-nature-90">
                        <label className="form-label form-label-text me-6">
                          手機*
                        </label>
                        <div className="checkout__col">
                          <input
                            type="text"
                            className={`form-control  w-100 form-input bg-white ${
                              errors.deliveryPhone && 'is-invalid'
                            }`}
                            placeholder="請輸入收貨人手機號碼"
                            {...register('deliveryPhone', {
                              required: {
                                value: true,
                                message: '請輸入收貨人手機號碼',
                              },
                              pattern: {
                                value: /^(0[2-8]\d{7}|09\d{8})$/,
                                message: '電話格式不正確',
                              },
                              minLength: {
                                value: 8,
                                message: '電話不少於 8 碼',
                              },
                            })}
                          />
                          <p className="invalid-feedback">
                            {errors.deliveryPhone?.message}
                          </p>
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-4 mb-8">
                        <div className="custom-radio">
                          <input
                            type="radio"
                            id="storePickup"
                            name="shipping"
                            className="form-check-input"
                            value="超商取貨"
                            {...register('shipping')}
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
                            type="radio"
                            id="homeDelivery"
                            name="shipping"
                            className="form-check-input"
                            value="宅配"
                            {...register('shipping')}
                          />
                          <label
                            className="form-check-label ms-2"
                            htmlFor="homeDelivery"
                          >
                            宅配
                          </label>
                        </div>
                      </div>
                      {shippingType === '宅配' && (
                        <AddressForm
                          register={register}
                          errors={{ ...errors }}
                        />
                      )}
                      {shippingType === '超商取貨' && (
                        <div className="d-flex flex-column mb-3 flex-md-row">
                          <label className="form-label form-label-text me-6">
                            取貨門市*
                          </label>
                          <div className="checkout__col">
                            <input
                              type="text"
                              className={`form-control  w-100 form-input bg-white ${
                                errors.storePickup && 'is-invalid'
                              }`}
                              placeholder="請輸入取貨門市"
                              {...register('storePickup', {
                                required: {
                                  value: true,
                                  message: '請輸入取貨門市',
                                },
                              })}
                            />
                            <p className="invalid-feedback">
                              {errors.storePickup?.message}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 付款方式 */}
                  <div className="mb-8">
                    <FormTitle
                      title="付款方式"
                      borderColor={`border-nature-90`}
                      titleBgColor={`bg-nature-90`}
                    />
                    <div className=" bg-white border border-nature-95">
                      <ul className="paymentList">
                        <li
                          className={`paymentList__item ${
                            paymentMethod === '信用卡' ? 'active' : ''
                          }`}
                        >
                          <div className="paymentList__item-header custom-radio d-flex align-items-center gap-8 px-5 py-6">
                            <div>
                              <input
                                className="form-check-input"
                                type="radio"
                                name="payment"
                                id="creditCard"
                                value="信用卡"
                                {...register('payment')}
                              />
                              <label
                                className="form-check-label"
                                htmlFor="creditCard"
                              >
                                信用卡
                              </label>
                            </div>
                            <div className="d-flex gap-1">
                              <img
                                src={getImgUrl('/images/checkout/ic_visa.png')}
                                alt="ic_visa"
                                width="30"
                              />
                              <img
                                src={getImgUrl(
                                  '/images/checkout/ic_master.png'
                                )}
                                alt="ic_master"
                                width="30"
                              />
                              <img
                                src={getImgUrl('/images/checkout/ic_jcb.png')}
                                alt="ic_jcb"
                                width="30"
                              />
                            </div>
                          </div>
                          {paymentMethod === '信用卡' && (
                            <div className="paymentList__item-content">
                              <div className="p-5">
                                <div className="d-flex flex-column  flex-md-row mb-3">
                                  <label className="form-label form-label-text">
                                    卡號*
                                  </label>
                                  <div className="checkout__col">
                                    <input
                                      type="text"
                                      className={`form-control w-100  form-input ${
                                        errors.cardNumber && 'is-invalid'
                                      }`}
                                      defaultValue="0920912091281234"
                                      placeholder="請輸入信用卡卡號"
                                      {...register('cardNumber', {
                                        required: '卡號為必填',
                                        pattern: {
                                          value: /^\d{16}$/,
                                          message: '卡號格式錯誤 (16 碼數字)',
                                        },
                                      })}
                                    />
                                    <p className="invalid-feedback">
                                      {errors.cardNumber?.message}
                                    </p>
                                  </div>
                                </div>
                                <div className="d-flex flex-column  flex-md-row mb-3">
                                  <label className="form-label form-label-text">
                                    有效期限*
                                  </label>
                                  <div className="checkout__col">
                                    <input
                                      type="text"
                                      className={`form-control  w-100 form-input ${
                                        errors.cardExpiry && 'is-invalid'
                                      } `}
                                      defaultValue="08/30"
                                      placeholder="請輸入信用卡有效期限"
                                      {...register('cardExpiry', {
                                        required: '有效期限為必填',
                                        pattern: {
                                          value: /^\d{2}\/\d{2}$/,
                                          message: '有效期限格式錯誤',
                                        },
                                      })}
                                    />
                                    <p className="invalid-feedback">
                                      {errors.cardExpiry?.message}
                                    </p>
                                  </div>
                                </div>
                                <div className="d-flex flex-column  flex-md-row mb-3">
                                  <label className="form-label form-label-text">
                                    卡片後三碼*
                                  </label>
                                  <div className="checkout__col">
                                    <input
                                      type="text"
                                      className={`form-control  w-100 form-input ${
                                        errors.cardCode && 'is-invalid'
                                      }`}
                                      defaultValue="801"
                                      placeholder="請輸入信用卡卡片後三碼"
                                      {...register('cardCode', {
                                        required: '卡片後三碼為必填',
                                        pattern: {
                                          value: /^\d{3}$/,
                                          message:
                                            '卡片後三碼格式錯誤 (3 碼數字)',
                                        },
                                      })}
                                    />
                                    <p className="invalid-feedback">
                                      {errors.cardCode?.message}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </li>
                        <li
                          className={`paymentList__item ${
                            paymentMethod === '街口支付' ? 'active' : ''
                          }`}
                        >
                          <div className="paymentList__item-header custom-radio d-flex align-items-center gap-8 px-5 py-6">
                            <div>
                              <input
                                className="form-check-input"
                                type="radio"
                                name="payment"
                                id="jkPay"
                                value="街口支付"
                                {...register('payment')}
                              />
                              <label
                                className="form-check-label"
                                htmlFor="jkPay"
                              >
                                街口支付
                              </label>
                            </div>
                            <div className="d-flex gap-1">
                              <img
                                src={getImgUrl('/images/checkout/jk-pay.png')}
                                alt="jk-pay"
                                width="59"
                              />
                            </div>
                          </div>
                        </li>
                        <li
                          className={`paymentList__item ${
                            paymentMethod === 'LINE Pay' ? 'active' : ''
                          }`}
                        >
                          <div className="paymentList__item-header custom-radio d-flex align-items-center gap-8 px-5 py-6">
                            <div>
                              <input
                                className="form-check-input"
                                type="radio"
                                name="payment"
                                id="linePay"
                                value="LINE Pay"
                                {...register('payment')}
                              />
                              <label
                                className="form-check-label"
                                htmlFor="linePay"
                              >
                                LINE Pay
                              </label>
                            </div>
                            <div className="d-flex gap-1">
                              <img
                                src={getImgUrl('/images/checkout/linepay.png')}
                                alt="linepay"
                                width="82"
                              />
                            </div>
                          </div>
                        </li>
                        <li
                          className={`paymentList__item ${
                            paymentMethod === 'ATM 轉帳' ? 'active' : ''
                          }`}
                        >
                          <div className="paymentList__item-header custom-radio d-flex align-items-center gap-8 px-5 py-6">
                            <div>
                              <input
                                className="form-check-input"
                                type="radio"
                                name="atm"
                                id="atm"
                                value="ATM 轉帳"
                                {...register('payment')}
                              />
                              <label className="form-check-label" htmlFor="atm">
                                ATM 轉帳
                              </label>
                            </div>
                          </div>
                        </li>
                        <li
                          className={`paymentList__item ${
                            paymentMethod === '貨到付款(僅限超商取貨)'
                              ? 'active'
                              : ''
                          }`}
                        >
                          <div className="paymentList__item-header custom-radio d-flex align-items-center gap-8 px-5 py-6">
                            <div>
                              <input
                                className="form-check-input"
                                type="radio"
                                name="cash-delivery"
                                id="cash-delivery"
                                value="貨到付款(僅限超商取貨)"
                                {...register('payment')}
                              />
                              <label
                                className="form-check-label"
                                htmlFor="cash-delivery"
                              >
                                貨到付款(僅限超商取貨)
                              </label>
                            </div>
                          </div>
                        </li>
                      </ul>
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
                          onClick={handleLastInvoiceInfo}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="invoiceData"
                        >
                          帶入上次結帳資料
                        </label>
                      </div>
                      <div className="mb-3">
                        <label className="form-label form-label-text">
                          發票類型
                        </label>
                        <select
                          className="form-select bg-white"
                          {...register('invoiceType')}
                        >
                          <option>電子發票</option>
                          <option>統編發票</option>
                        </select>
                      </div>
                      {invoiceType === '電子發票' && (
                        <div className="mb-3">
                          <label className="form-label form-label-text">
                            發票載具
                          </label>
                          <select
                            className="form-select bg-white"
                            {...register('carrier')}
                          >
                            <option>存入會員載具，中獎後通知</option>
                            <option>手機條碼載具</option>
                          </select>
                        </div>
                      )}

                      {carrierType === '手機條碼載具' && (
                        <div className="d-flex flex-column mb-3 flex-md-row">
                          <label className="form-label form-label-text me-6">
                            手機載具條碼*
                          </label>
                          <div className="checkout__col">
                            <input
                              type="text"
                              className={`form-control  w-100 form-input bg-white ${
                                errors.athleteBarcode && 'is-invalid'
                              }`}
                              placeholder="前面加上 / ，加上 7 個數字及大寫字母字元"
                              {...register('athleteBarcode', {
                                required: {
                                  value: true,
                                  message: '請輸入手機載具條碼',
                                },
                                pattern: {
                                  value: /^\/[A-Z0-9]{7}$/,
                                  message: '條碼格式錯誤',
                                },
                              })}
                            />
                            <p className="invalid-feedback">
                              {errors.athleteBarcode?.message}
                            </p>
                          </div>
                        </div>
                      )}

                      {invoiceType === '統編發票' && (
                        <div className="d-flex flex-column mb-3 flex-md-row">
                          <label className="form-label form-label-text me-6">
                            公司抬頭*
                          </label>
                          <div className="checkout__col">
                            <input
                              type="text"
                              className={`form-control  w-100 form-input bg-white ${
                                errors.companyTitle && 'is-invalid'
                              }`}
                              placeholder="請輸入公司抬頭"
                              {...register('companyTitle', {
                                required: {
                                  value: true,
                                  message: '請輸入公司抬頭',
                                },
                                pattern: {
                                  value: /^[\u4e00-\u9fa5a-zA-Z0-9&\s-]{2,50}$/,
                                  message:
                                    '公司抬頭格式錯誤，請輸入 2 到 50 個字元的有效名稱',
                                },
                              })}
                            />
                            <p className="invalid-feedback">
                              {errors.companyTitle?.message}
                            </p>
                          </div>
                        </div>
                      )}
                      {invoiceType === '統編發票' && (
                        <div className="d-flex flex-column mb-3 flex-md-row">
                          <label className="form-label form-label-text me-6">
                            公司統編*
                          </label>
                          <div className="checkout__col">
                            <input
                              type="text"
                              className={`form-control  w-100 form-input bg-white ${
                                errors.companyId && 'is-invalid'
                              }`}
                              placeholder="請輸入公司統編"
                              {...register('companyId', {
                                required: {
                                  value: true,
                                  message: '請輸入公司統編',
                                },
                                pattern: {
                                  value: /^\d{8}$/,
                                  message: '統編格式錯誤，必須是 8 位數字',
                                },
                              })}
                            />
                            <p className="invalid-feedback">
                              {errors.companyId?.message}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 結帳明細 */}
                <div className="col-lg-3">
                  <div className="border">
                    <FormTitle
                      title="結帳明細"
                      borderColor={`border-nature-90 border-1`}
                      titleBgColor="bg-white text-nature-10 py-4"
                    />
                    <div className="bg-white p-4">
                      <div className="d-flex justify-content-between">
                        <span>商品原價金額</span>
                        <span className="fw-bold">
                          NT {carts.total.toLocaleString('zh-TW')}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between mt-2">
                        <span>結帳金額</span>
                        <span className="fw-bold text-danger">
                          NT {carts.final_total.toLocaleString('zh-TW')}
                        </span>
                      </div>
                      <button className="btn btn-warning w-100 mt-3">
                        確認付款
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
      <ScreenLoading isLoading={isLoading} />
    </>
  );
}
