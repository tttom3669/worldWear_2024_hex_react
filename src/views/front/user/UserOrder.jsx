import useImgUrl from '../../../hooks/useImgUrl';
import FormTitle from '../../../components/front/FormTitle';
import UserAside from '../../../components/front/UserAside';

export default function UserOrder() {
  const getImgUrl = useImgUrl();
  return (
    <>
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
                  <ul>
                    <li>
                      <div className="bg-nature-95 px-3 py-4 border border-nature-90">
                        <div className="d-flex align-items-start justify-content-between flex-column gap-2 flex-lg-row">
                          <div className="d-flex flex-column gap-2">
                            <h3 className="d-flex align-items-center gap-1 fs-base fw-normal">
                              <span>訂單編號 :</span>
                              <span>222222222222</span>
                            </h3>
                            <div className="d-flex align-items-center gap-1">
                              <span> 訂單總額 :</span>
                              <span className="text-secondary-50">
                                NT$2,400
                              </span>
                              （含運費）
                            </div>
                          </div>
                          <div className="d-flex align-items-center gap-1">
                            <span> 訂購日期 :</span>
                            <time>2024/09/15 13:31</time>
                          </div>
                        </div>
                      </div>

                      <details className="order-list">
                        <summary className="d-flex justify-content-center align-items-center gap-2 bg-nature-90 py-3">
                          2 項商品
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
                              title={'配送中'}
                              borderColor={`border-nature-90`}
                              titleBgColor={`bg-nature-90`}
                            />
                            <ul>
                              <li className="border-bottom border-nature-90 d-flex justify-content-between align-items-center border-opacity-0 py-2 border-opacity-sm-100 px-sm-3 py-sm-5">
                                <div className="d-flex gap-3 w-100">
                                  <img
                                    style={{
                                      aspectRatio: '131/108',
                                      maxWidth: '108px',
                                    }}
                                    className="object-fit-cover"
                                    src={getImgUrl(
                                      '/images/home/category-top.png'
                                    )}
                                    alt=""
                                  />
                                  <div className="d-flex flex-column gap-1 flex-fill">
                                    <h3 className="fs-base fw-normal">
                                      韓國連線 七月新品
                                    </h3>
                                    <p>EU27帆布皮帶側開叉牛仔長裙</p>
                                    <div className="d-flex flex-row flex-fill justify-content-between flex-lg-column">
                                      <p>規格:白/L</p>
                                      <p className="mt-auto text-secondary-50">
                                        NT$1,650
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="d-none d-lg-block text-nowrap">
                                  1 件
                                </div>
                              </li>
                              <li className="border-bottom border-nature-90 d-flex justify-content-between align-items-center border-opacity-0 py-2 border-opacity-sm-100 px-sm-3 py-sm-5">
                                <div className="d-flex gap-3 w-100">
                                  <img
                                    style={{
                                      aspectRatio: '131/108',
                                      maxWidth: '108px',
                                    }}
                                    className="object-fit-cover"
                                    src={getImgUrl(
                                      '/images/home/category-top.png'
                                    )}
                                    alt=""
                                  />
                                  <div className="d-flex flex-column gap-1 flex-fill">
                                    <h3 className="fs-base fw-normal">
                                      韓國連線 七月新品
                                    </h3>
                                    <p>EU27帆布皮帶側開叉牛仔長裙</p>
                                    <div className="d-flex flex-row flex-fill justify-content-between flex-lg-column">
                                      <p>規格:白/L</p>
                                      <p className="mt-auto text-secondary-50">
                                        NT$1,650
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="d-none d-lg-block text-nowrap">
                                  1 件
                                </div>
                              </li>
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
                                  <span> NT$2,400(已折抵:活動折抵 NT$200)</span>
                                </div>
                                <div className="d-flex gap-1">
                                  <span>付款方式 :</span>
                                  <span>信用卡一次付款</span>
                                </div>
                              </li>
                              <li>
                                <h3 className="py-2 fw-bold fs-base text-nature-50 border-2 border-bottom border-nature-95 mb-1 mb-sm-5">
                                  配送資訊
                                </h3>
                                <div className="d-flex gap-1">
                                  <span> 收件人 :</span>
                                  <span> 葉大雄</span>
                                </div>
                                <div className="d-flex gap-1">
                                  <span> 配送方式 : </span>
                                  <span> 宅配</span>
                                </div>

                                <div className="d-flex gap-1">
                                  <span> 配送地址 :</span>
                                  <span> v市f區xx路123號</span>
                                </div>
                                <div className="d-flex gap-1">
                                  <span> 聯絡電話 : </span>
                                  <span>0912345677</span>
                                </div>
                              </li>
                              <li>
                                <h3 className="py-2 fw-bold fs-base text-nature-50 border-2 border-bottom border-nature-95 mb-1 mb-sm-5">
                                  發票資訊
                                </h3>
                                <div className="d-flex gap-1">
                                  <span> 發票類型 :</span>
                                  <span> 電子發票</span>
                                </div>
                                <div className="d-flex gap-1">
                                  <span>發票載具 : </span>
                                  <span> 會員載具</span>
                                </div>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </details>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
