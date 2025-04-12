import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
const { VITE_API_PATH: API_PATH } = import.meta.env;
import { Modal } from 'bootstrap';
import FormTitle from '../../components/front/FormTitle';
import useSwal from '../../hooks/useSwal';
import ScreenLoading from '../../components/front/ScreenLoading';
import AdminPagination from '../../components/admin/AdminPagination';
import { useLocation } from 'react-router-dom';

export default function AdminOrders() {
  const [orderData, setOrderData] = useState([]);
  const [filterOrderData, setFilterOrderData] = useState([]);
  const token = useSelector((state) => state.authSlice.token);
  const orderModalRef = useRef(null);
  const adminOrderModal = useRef(null);
  const [tempOrderData, setTempOrderData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { toastAlert } = useSwal();

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const pageParam = queryParams.get('page');
  const [paginationData, setPaginationData] = useState({
    totalPage: 0,
    currentPage: 0,
  });
  const pageLimit = 10;

  const [searchOrderData, setSearchOrderData] = useState({
    orderId: '',
    orderDate: '',
    orderStatus: '',
  });

  const getOrder = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_PATH}/admin/orders/?_expand=user`, {
        headers: {
          authorization: token,
        },
      });
      setOrderData(res.data);
      setFilterOrderData(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const handlePageChange = useCallback(
    async (page = 1) => {
      try {
        setIsLoading(true);
        const res = await axios.get(
          `${API_PATH}/admin/orders/?_expand=user&_page=${page}&_limit=${pageLimit}`,
          {
            headers: {
              authorization: token,
            },
          }
        );
        setFilterOrderData(res.data);

        // if (tempUserData.id) {
        //   setTempUserData(res.data.find((user) => user.id === tempUserData.id));
        // }
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    },
    [token]
  );
  const openModal = (user) => {
    adminOrderModal.current.show();
    setTempOrderData(user);
  };
  const closeModal = () => {
    adminOrderModal.current.hide();
  };

  const changeOrder = async (orderId, patchData) => {
    try {
      const res = await axios.patch(
        `${API_PATH}/admin/orders/${orderId}`,
        {
          ...patchData,
        },
        {
          headers: {
            authorization: token,
          },
        }
      );
      setTempOrderData(res.data);
      toastAlert({
        icon: 'success',
        title: '更新成功',
      });
      getOrder();
    } catch (error) {
      console.log(error);
      toastAlert({
        icon: 'error',
        title: '更新失敗',
      });
    }
  };

  const handleSearchOrder = () => {
    const { orderId = '', orderDate, orderStatus = '' } = searchOrderData;

    // 檢查是否至少有一個條件
    // 沒有條件時，不過濾
    if (!orderId && !orderDate && !orderStatus) {
      setFilterOrderData(orderData);
      setSearchOrderData({
        orderId: '',
        orderDate: '',
        orderStatus: '',
      });
      return;
    }

    const hasMatchingOrder = (order) => {
      const orderDateFormatted = order.orderDate?.split(' ')[0]; // 取 "YYYY/MM/DD"
      console.log(orderDateFormatted);
      console.log(orderDate.replace(/-/g, '/'));
      return orderDateFormatted === orderDate.replace(/-/g, '/'); // 格式轉換後比對
    };

    const filteredUser = [...orderData].filter((order) => {
      console.log(hasMatchingOrder(order));
      return (
        (!orderId || new RegExp(orderId, 'i').test(order.id)) &&
        (!orderDate || hasMatchingOrder(order)) &&
        (!orderStatus || new RegExp(orderStatus, 'i').test(order.status))
      );
    });

    setFilterOrderData(filteredUser);
    setSearchOrderData({
      orderId: '',
      orderDate: '',
      orderStatus: '',
    });
  };

  useEffect(() => {
    getOrder();
    adminOrderModal.current = new Modal(orderModalRef.current);
  }, [getOrder]);

  // 初次載入時，設置總頁數和當前頁數
  useEffect(() => {
    setPaginationData({
      totalPage: Math.ceil(orderData.length / pageLimit),
      currentPage: 1,
    });
    handlePageChange(1);
  }, [orderData, handlePageChange]);

  useEffect(() => {
    if (!pageParam) {
      return;
    }
    setPaginationData((prevData) => ({
      ...prevData,
      currentPage: Number(pageParam),
    }));
    handlePageChange(pageParam);
  }, [pageParam, handlePageChange]);

  return (
    <>
      <title>訂單管理 - WorldWear</title>
      <div className="p-10 h-100">
        <div className="d-flex flex-column h-100">
          <div className="d-flex align-items-center gap-6 mb-6">
            <h1 className="fs-h4 ">所有訂單</h1>
          </div>
          <div className="d-flex w-100 mb-6">
            <div className="d-flex w-100 align-items-center gap-6 mb-6">
              <div className="form-floating">
                <input
                  type="text"
                  className="form-control"
                  id="floatingUserId"
                  placeholder="訂單編號"
                  value={searchOrderData.orderId}
                  onChange={(e) =>
                    setSearchOrderData({
                      ...searchOrderData,
                      orderId: e.target.value,
                    })
                  }
                />
                <label htmlFor="floatingUserId">訂單編號</label>
                <div id="emailHelp" className="form-text"></div>
              </div>
              <div className="form-floating">
                <input
                  type="date"
                  className="form-control"
                  id="floatingDate"
                  value={searchOrderData.orderDate}
                  onChange={(e) =>
                    setSearchOrderData({
                      ...searchOrderData,
                      orderDate: e.target.value,
                    })
                  }
                />
                <label htmlFor="floatingDate">訂單時間</label>
              </div>
              <select
                className="form-select"
                style={{ maxWidth: '20%' }}
                value={searchOrderData.orderStatus}
                onChange={(e) =>
                  setSearchOrderData({
                    ...searchOrderData,
                    orderStatus: e.target.value,
                  })
                }
              >
                <option>訂單狀態</option>
                <option value="未出貨"> 未出貨</option>
                <option value="已出貨"> 已出貨</option>
                <option value="退貨"> 退貨</option>
                <option value="已刪除"> 已刪除</option>
                <option value="已完成"> 已完成</option>
              </select>
              <button
                type="button"
                className="btn btn-primary px-10 py-3"
                onClick={handleSearchOrder}
              >
                查詢
              </button>
            </div>
          </div>
          {filterOrderData.length > 0 ? (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">訂單編號</th>
                    <th scope="col">收件人</th>
                    <th scope="col">聯絡電話</th>
                    <th scope="col">購買時間</th>
                    <th scope="col">購買款項</th>
                    <th scope="col">應付金額</th>
                    <th scope="col">是否付款</th>
                    <th scope="col">訂單狀態</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filterOrderData?.map((order) => (
                    <tr key={order.id}>
                      <th scope="row">{order.id}</th>
                      <td>{order?.deliveryInfo?.recipient}</td>
                      <td>{order?.deliveryInfo?.phone}</td>
                      <td>{order?.orderDate}</td>
                      <td>
                        <ul>
                          {order?.products?.map((productItem) => (
                            <li key={order.id + productItem.product.id}>
                              {productItem.product.title}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td>{order.final_total}</td>
                      <td>{order.is_paid ? '已付款' : '未付款'}</td>
                      <td>{order.status}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => openModal(order)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              fill="currentColor"
                              className="bi bi-pencil-fill"
                              viewBox="0 0 16 16"
                            >
                              <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <>
              <h3 className="fs-h5 text-center py-10">未搜尋到使用者</h3>
            </>
          )}
          {paginationData.totalPage > 0 && (
            <AdminPagination
              paginationData={paginationData}
              apiPath="/admin/orders"
            />
          )}
        </div>
      </div>
      <div
        className="modal fade"
        id="adminUsersModal"
        tabIndex="-1"
        aria-labelledby="adminUsersModalLabel"
        aria-modal="true"
        ref={orderModalRef}
      >
        <div className="modal-dialog modal-xl modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-h3" id="adminUsersModalLabel">
                訂單細節
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={closeModal}
              ></button>
            </div>
            <div className="modal-body p-6">
              <FormTitle
                title="配送資訊"
                titleBgColor={'bg-nature-80'}
                borderColor={'border-nature-80'}
              />
              <div className="d-flex flex-column gap-5 bg-white py-8 px-5 border border-nature-95 mb-10">
                <div className="d-flex align-items-center gap-6">
                  <h3 className="fs-base">收貨人</h3>
                  <div>{tempOrderData?.deliveryInfo?.recipient}</div>
                </div>
                <div className="d-flex align-items-center gap-6">
                  <h3 className="fs-base">配送方式</h3>
                  <div>{tempOrderData?.deliveryInfo?.deliveryMethod}</div>
                </div>
                <div className="d-flex align-items-center gap-6">
                  <h3 className="fs-base">配送地址</h3>
                  <div>{tempOrderData?.deliveryInfo?.address}</div>
                </div>
                <div className="d-flex align-items-center gap-6">
                  <h3 className="fs-base">聯絡電話</h3>
                  <div>{tempOrderData?.deliveryInfo?.phone}</div>
                </div>
              </div>
              <FormTitle
                title="訂單內容"
                titleBgColor={'bg-nature-80'}
                borderColor={'border-nature-80'}
              />
              <div className="d-flex flex-column gap-5 bg-white py-8 px-5 border border-nature-95 mb-10">
                <div className="d-flex align-items-center gap-6">
                  <h3 className="fs-base">訂單編號</h3>
                  <div>{tempOrderData.id}</div>
                </div>
                <div className="d-flex align-items-center gap-6">
                  <h3 className="fs-base"> 購買時間</h3>
                  <div>{tempOrderData.orderDate}</div>
                </div>
                <div className="d-flex align-items-center gap-6">
                  <h3 className="fs-base">付款狀態</h3>
                  <div>{tempOrderData.is_paid ? '已付款' : '未付款'}</div>
                </div>
                <div className="d-flex align-items-center gap-6">
                  <h3 className="fs-base">總金額</h3>
                  <div>{tempOrderData.final_total}</div>
                </div>
                <div className="d-flex align-items-center gap-6">
                  <h3 className="fs-base">訂單狀態</h3>
                  <select
                    className="form-select"
                    style={{ maxWidth: '20%' }}
                    value={tempOrderData.status}
                    onChange={(e) =>
                      changeOrder(tempOrderData.id, { status: e.target.value })
                    }
                    aria-label="Default select example"
                  >
                    <option value="未出貨"> 未出貨</option>
                    <option value="已出貨"> 已出貨</option>
                    <option value="退貨"> 退貨</option>
                    <option value="已刪除"> 已刪除</option>
                    <option value="已完成"> 已完成</option>
                  </select>
                </div>
              </div>
              <FormTitle
                title="選購商品"
                titleBgColor={'bg-nature-80'}
                borderColor={'border-nature-80'}
              />
              <div className="d-flex flex-column gap-5 bg-white py-8 px-5 border border-nature-95 mb-10">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">品名</th>
                      <th scope="col">顏色 / 尺寸 </th>
                      <th scope="col">件數</th>
                      <th scope="col">金額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tempOrderData?.products?.map((productItem) => (
                      <tr
                        key={tempOrderData.id + productItem.product.id}
                        scope="row"
                      >
                        <th className="fs-base fw-normal">
                          {productItem.product.title}
                        </th>
                        <th className="fw-normal">
                          {productItem.color}/{productItem.size}
                        </th>
                        <th className="fw-normal">{productItem.qty} 件</th>
                        <th className="fw-normal">
                          ${productItem.product.price.toLocaleString('zh-TW')}
                        </th>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="form-check d-flex align-items-center justify-content-end gap-2">
                <input
                  type="checkbox"
                  checked={tempOrderData.is_paid || false}
                  className="form-check-input"
                  id="exampleCheck1"
                  onChange={(e) =>
                    changeOrder(tempOrderData.id, { is_paid: e.target.checked })
                  }
                />
                <label className="form-check-label" htmlFor="exampleCheck1">
                  {tempOrderData?.is_paid ? '已付款' : '未付款'}
                </label>
              </div>
            </div>
            <div className="modal-footer">
              {/* <button
                      type="button"
                      className="btn btn-secondary"
                      data-bs-dismiss="modal"
                    >
                      取消
                    </button> */}
              <button
                type="button"
                className="btn btn-primary"
                data-bs-dismiss="modal"
              >
                返回
              </button>
            </div>
          </div>
        </div>
      </div>
      <ScreenLoading isLoading={isLoading} />
    </>
  );
}
