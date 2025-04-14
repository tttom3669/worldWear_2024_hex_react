import useImgUrl from '../../../hooks/useImgUrl';
import FormTitle from '../../../components/front/FormTitle';
import UserAside from '../../../components/front/UserAside';
import ScreenLoading from '../../../components/front/ScreenLoading';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';

export default function UserOrder() {
  const getImgUrl = useImgUrl();
  const { VITE_API_PATH: API_PATH } = import.meta.env;
  const [orderData, setOrderData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const getOrder = useCallback(async () => {
    try {
      setIsLoading(true);
      const userId =
        document.cookie
          .split('; ')
          .find((row) => row.startsWith(`worldWearUserId`))
          ?.split('=')[1] || '';
      const token =
        document.cookie
          .split('; ')
          .find((row) => row.startsWith(`worldWearToken`))
          ?.split('=')[1] || '';
      const res = await axios.get(`${API_PATH}/orders?userId=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setOrderData(res.data);
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  }, [API_PATH]);

  useEffect(() => {
    getOrder();
  }, [getOrder]);
  return (
    <>
      <title>查詢訂單 - WorldWear</title>
      <main>
        <div className="pt-3 pb-3 pt-md-10 pb-md-25">
          <div className="container px-0 px-sm-3">
            <div className="row mx-0 mx-sm-n3">
              <div className="d-none col-lg-2 d-lg-block">
                <UserAside />
              </div>
              <div className="col-lg-10 px-0 px-sm-3">
                <h1 className="fs-h5 fw-bold mb-3 px-3 px-sm-0 mb-md-5">
                  訂單列表
                </h1>
                <div className="bg-white border-opacity-0 border-opacity-sm-100 border border-nature-95 px-3 py-6 p-sm-6">
                  <ul className="d-flex flex-column gap-5">
                    {orderData?.length > 0 ? (
                      orderData.map((order) => (
                        <li key={order.id}>
                          <div className="bg-nature-95 px-3 py-4 border border-nature-90">
                            <div className="d-flex align-items-start justify-content-between flex-column gap-2 flex-lg-row">
                              <div className="d-flex flex-column gap-2">
                                <h3 className="d-flex align-items-center gap-1 fs-base fw-normal">
                                  <span>訂單編號 :</span>
                                  <span>{order.id}</span>
                                </h3>
                                <div className="d-flex align-items-center gap-1">
                                  <span> 訂單總額 :</span>
                                  <span className="text-secondary-50">
                                    NT$
                                    {order.final_total.toLocaleString('zh-TW')}
                                  </span>
                                  （含運費）
                                </div>
                              </div>
                              <div className="d-flex align-items-center gap-1">
                                <span> 訂購日期 :</span>
                                <time>{order.orderDate}</time>
                              </div>
                            </div>
                          </div>

                          <details className="order-list">
                            <summary className="d-flex justify-content-center align-items-center gap-2 bg-nature-90 py-3">
                              {order.products.length} 項商品
                              <svg className="pe-none" width="12" height="8">
                                <use
                                  href={getImgUrl(
                                    '/icons/chevron-down.svg#chevron-down'
                                  )}
                                />
                              </svg>
                            </summary>
                            <div className="border border-nature-95 border-opacity-0 pt-6 border-opacity-sm-100 p-sm-6">
                              <div className="mb-4 mb-sm-5.5">
                                <FormTitle
                                  title={order.status}
                                  borderColor={`border-nature-90`}
                                  titleBgColor={`bg-nature-90`}
                                />
                                <ul>
                                  {order.products.map((productItem) => (
                                    <li
                                      key={order.id + productItem.product.id}
                                      className="border-bottom border-nature-90 d-flex justify-content-between align-items-center border-opacity-0 py-2 border-opacity-sm-100 px-sm-3 py-sm-5"
                                    >
                                      <div className="d-flex gap-3 w-100">
                                        <img
                                          style={{
                                            aspectRatio: '131/108',
                                            maxWidth: '108px',
                                          }}
                                          className="object-fit-cover"
                                          src={productItem.product.imageUrl}
                                          alt={productItem.product.title}
                                        />
                                        <div className="d-flex flex-column gap-1 flex-fill">
                                          <h3 className="fs-base fw-normal">
                                            {productItem.product.title}
                                          </h3>

                                          <div className="d-flex flex-row flex-fill justify-content-between flex-lg-column">
                                            <p>
                                              規格:{productItem.color}/
                                              {productItem.size}
                                            </p>
                                            <p className="mt-auto text-secondary-50 d-none d-lg-block">
                                              NT$
                                              {productItem.product.price.toLocaleString(
                                                'zh-TW'
                                              )}
                                            </p>
                                            <p className="mt-auto text-secondary-50 d-block d-lg-none">
                                              NT$
                                              {(
                                                productItem.product.price *
                                                productItem.qty
                                              ).toLocaleString('zh-TW')}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="d-none d-lg-block text-nowrap">
                                        {productItem.qty} 件
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="border-bottom border-2 border-nature-95 pb-3 border-opacity-100 pb-sm-0 border-opacity-sm-0">
                                <FormTitle
                                  title={'付款明細'}
                                  className={`mb-3 mb-sm-5`}
                                  borderColor={`border-nature-90`}
                                  titleBgColor={`bg-nature-90`}
                                />
                                <ul className="order-detail">
                                  <li>
                                    <h3 className="py-2 fw-bold fs-base text-nature-50 border-2 border-bottom border-nature-95 mb-1 mb-sm-5">
                                      付款資訊
                                    </h3>
                                    <div className="d-flex gap-1">
                                      <span>訂購總額 :</span>
                                      <span>
                                        NT${order.paymentInfo.totalAmount}
                                        (已折抵:活動折抵 NT$
                                        {order.paymentInfo.discount.toLocaleString(
                                          'zh-TW'
                                        )}
                                        )
                                      </span>
                                    </div>
                                    <div className="d-flex gap-1">
                                      <span>付款方式 :</span>
                                      <span>
                                        {order.paymentInfo.paymentMethod}
                                      </span>
                                    </div>
                                  </li>
                                  <li>
                                    <h3 className="py-2 fw-bold fs-base text-nature-50 border-2 border-bottom border-nature-95 mb-1 mb-sm-5">
                                      配送資訊
                                    </h3>
                                    <div className="d-flex gap-1">
                                      <span> 收件人 :</span>
                                      <span>
                                        {order.deliveryInfo.recipient}
                                      </span>
                                    </div>
                                    <div className="d-flex gap-1">
                                      <span> 配送方式 : </span>
                                      <span>
                                        {order.deliveryInfo.deliveryMethod}
                                      </span>
                                    </div>

                                    <div className="d-flex gap-1">
                                      <span className="text-nowrap">
                                        配送地址 :
                                      </span>
                                      <span>{order.deliveryInfo.address}</span>
                                    </div>
                                    <div className="d-flex gap-1">
                                      <span> 聯絡電話 : </span>
                                      <span>{order.deliveryInfo.phone}</span>
                                    </div>
                                  </li>
                                  <li>
                                    <h3 className="py-2 fw-bold fs-base text-nature-50 border-2 border-bottom border-nature-95 mb-1 mb-sm-5">
                                      發票資訊
                                    </h3>
                                    <div className="d-flex gap-1">
                                      <span> 發票類型 :</span>
                                      <span>
                                        {order.invoiceInfo.invoiceType}
                                      </span>
                                    </div>
                                    {order.invoiceInfo.invoiceType ===
                                      '電子發票' && (
                                      <div className="d-flex gap-1">
                                        <span className="text-nowrap">
                                          發票載具 :
                                        </span>
                                        <span>{order.invoiceInfo.carrier}</span>
                                      </div>
                                    )}
                                    {order.invoiceInfo.invoiceType ===
                                      '電子發票' &&
                                      order.invoiceInfo.carrier ===
                                        '手機條碼載具' && (
                                        <div className="d-flex gap-1">
                                          <span>手機條碼 :</span>
                                          <span>
                                            {order.invoiceInfo.athleteBarcode}
                                          </span>
                                        </div>
                                      )}
                                    {order.invoiceInfo.invoiceType ===
                                      '統編發票' && (
                                      <>
                                        <div className="d-flex gap-1">
                                          <span> 公司抬頭 :</span>
                                          <span>
                                            {order.invoiceInfo.companyTitle}
                                          </span>
                                        </div>
                                        <div className="d-flex gap-1">
                                          <span> 公司統編 :</span>
                                          <span>
                                            {order.invoiceInfo.companyId}
                                          </span>
                                        </div>
                                      </>
                                    )}
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </details>
                        </li>
                      ))
                    ) : (
                      <>
                        <h2 className="fs-h6 text-center text-nature-60">
                          暫無訂單
                        </h2>
                      </>
                    )}
                  </ul>
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
