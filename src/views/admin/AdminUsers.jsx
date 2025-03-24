import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
const { VITE_API_PATH: API_PATH } = import.meta.env;
import { Modal } from 'bootstrap';
import FormTitle from '../../components/front/FormTitle';
import useSwal from '../../hooks/useSwal';
import ScreenLoading from '../../components/front/ScreenLoading';

export default function AdminUsers() {
  const [userData, setUserData] = useState([]);
  const [filterUserData, setFilterUserData] = useState([]);
  const token = useSelector((state) => state.authSlice.token);
  const modalRef = useRef(null);
  const orderModalRef = useRef(null);
  const adminUserModal = useRef(null);
  const adminOrderModal = useRef(null);
  const [tempUserData, setTempUserData] = useState({});
  const [tempOrderData, setTempOrderData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { toastAlert } = useSwal();

  const [searchUserData, setSearchUserData] = useState({
    username: '',
    userId: '',
    orderDate: '',
  });

  const orderCount = (orders) => {
    return orders
      ? orders?.reduce((acc, order) => {
          return acc + order.final_total;
        }, 0)
      : 0;
  };
  const getUser = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_PATH}/admin/users/?_embed=orders`, {
        headers: {
          authorization: token,
        },
      });
      setUserData(res.data);
      setFilterUserData(res.data);
      if (tempUserData.id) {
        setTempUserData(res.data.find((user) => user.id === tempUserData.id));
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };
  const openModal = (user) => {
    adminUserModal.current.show();
    setTempUserData(user);
  };
  const closeModal = () => {
    adminUserModal.current.hide();
  };
  const openOrderModal = (order) => {
    adminOrderModal.current.show();
    setTempOrderData(order);
    closeModal();
  };
  const closeOrderModal = () => {
    adminOrderModal.current.hide();
    adminUserModal.current.show();
  };

  const changeOrder = async (orderId, patchData) => {
    try {
      const res = await axios.patch(
        `${API_PATH}/orders/${orderId}`,
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
      getUser();
    } catch (error) {
      console.log(error);
      toastAlert({
        icon: 'error',
        title: '更新失敗',
      });
    }
  };

  const handleSearchUser = () => {
    const { username = '', userId = '', orderDate } = searchUserData;

    // 檢查是否至少有一個條件
    // 沒有條件時，不過濾
    if (!username && !userId && !orderDate) {
      setFilterUserData(userData);
      setSearchUserData({
        username: '',
        userId: '',
        orderDate: '',
      });
      return;
    }

    const hasMatchingOrder = (user) =>
      user.orders?.some((order) => {
        const orderDateFormatted = order.orderDate?.split(' ')[0]; // 取 "YYYY/MM/DD"
        return orderDateFormatted === orderDate.replace(/-/g, '/'); // 格式轉換後比對
      });

    const filteredUser = [...userData].filter((user) => {
      return (
        (!username || new RegExp(username, 'i').test(user.username)) &&
        (!userId || new RegExp(userId, 'i').test(user.id)) &&
        (!orderDate || hasMatchingOrder(user))
      );
    });

    setFilterUserData(filteredUser);
    setSearchUserData({
      username: '',
      userId: '',
      orderDate: '',
    });
  };

  useEffect(() => {
    getUser();
    adminUserModal.current = new Modal(modalRef.current);
    adminOrderModal.current = new Modal(orderModalRef.current);
  }, []);

  return (
    <>
      <title>使用者管理 - WorldWear</title>
      <div className="container">
        <div className="py-10">
          <div className="d-flex align-items-center gap-6 mb-6">
            <h1 className="fs-h4 ">所有會員</h1>
            <div>會員總數：{filterUserData.length} 人</div>
          </div>
          <div className="d-flex mb-6">
            <div className="d-flex align-items-center gap-6 mb-6">
              <div className="form-floating">
                <input
                  type="text"
                  className="form-control"
                  id="floatingUserId"
                  placeholder="會員編號"
                  value={searchUserData.userId}
                  onChange={(e) =>
                    setSearchUserData({
                      ...searchUserData,
                      userId: e.target.value,
                    })
                  }
                />
                <label htmlFor="floatingUserId">會員編號</label>
                <div id="emailHelp" className="form-text"></div>
              </div>
              <div className="form-floating">
                <input
                  type="text"
                  className="form-control"
                  id="floatingName"
                  placeholder="會員姓名"
                  value={searchUserData.username}
                  onChange={(e) =>
                    setSearchUserData({
                      ...searchUserData,
                      username: e.target.value,
                    })
                  }
                />
                <label htmlFor="floatingName">會員姓名</label>
              </div>
              <div className="form-floating">
                <input
                  type="date"
                  className="form-control"
                  id="floatingDate"
                  value={searchUserData.orderDate}
                  onChange={(e) =>
                    setSearchUserData({
                      ...searchUserData,
                      orderDate: e.target.value,
                    })
                  }
                />
                <label htmlFor="floatingDate">訂單時間</label>
              </div>
              <button
                type="button"
                className="btn btn-primary px-10 py-3"
                onClick={handleSearchUser}
              >
                查詢
              </button>
            </div>
          </div>
          {filterUserData.length > 0 ? (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">會員編號</th>
                    <th scope="col">會員姓名</th>
                    {/* <th scope="col">狀態</th> */}
                    <th scope="col">消費總額</th>
                    <th scope="col">訂單數</th>
                    <th>最後一筆訂單時間</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filterUserData?.map((user) => (
                    <tr key={user.id}>
                      <th scope="row">{user.id}</th>
                      <td>{user.username}</td>
                      {/* <td>{user.status || '啟用'}</td> */}
                      <td>{orderCount(user.orders)}</td>
                      <td>{user?.orders?.length}</td>
                      <td>
                        {user?.orders[user.orders?.length - 1]?.orderDate ||
                          '未有訂單'}
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => openModal(user)}
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
              <h3 className='fs-h5 text-center py-10'>未搜尋到使用者</h3>
            </>
          )}
        </div>
      </div>
      <div
        className="modal fade"
        id="adminUsersModal"
        tabIndex="-1"
        aria-labelledby="adminUsersModalLabel"
        aria-modal="true"
        ref={modalRef}
      >
        <div className="modal-dialog modal-xl modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-h3" id="adminUsersModalLabel">
                會員資料
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body p-6">
              <div className="mb-10">
                <div className="d-flex align-items-center gap-6 mb-6">
                  <h3 className="fs-h6">會員編號</h3>
                  <div>{tempUserData.id}</div>
                </div>
                <div className="d-flex align-items-center gap-6">
                  <h3 className="fs-h6">會員姓名</h3>
                  <div>{tempUserData.username}</div>
                </div>
              </div>
              <FormTitle
                title="會員詳情"
                titleBgColor={'bg-nature-80'}
                borderColor={'border-nature-80'}
              />
              <div className="d-flex flex-column gap-5 bg-white py-8 px-5 border border-nature-95 mb-10">
                <div className="d-flex align-items-center gap-6">
                  <h3 className="fs-base">會員等級</h3>
                  <div>一般會員</div>
                </div>
                <div className="d-flex align-items-center gap-6">
                  <h3 className="fs-base">消費總額</h3>
                  <div>{orderCount(tempUserData.orders)}</div>
                </div>
                <div className="d-flex align-items-center gap-6">
                  <h3 className="fs-base">訂單總數</h3>
                  <div>{tempUserData?.orders?.length}</div>
                </div>
              </div>
              <FormTitle
                title="基本資料"
                titleBgColor={'bg-nature-80'}
                borderColor={'border-nature-80'}
              />
              <div className="d-flex flex-column gap-5 bg-white py-8 px-5 border border-nature-95 mb-10">
                <div className="d-flex align-items-center gap-6">
                  <h3 className="fs-base">生日</h3>
                  <div>{tempUserData.birthday}</div>
                </div>
                <div className="d-flex align-items-center gap-6">
                  <h3 className="fs-base">會員電話</h3>
                  <div>{tempUserData.tel}</div>
                </div>
                <div className="d-flex align-items-center gap-6">
                  <h3 className="fs-base">會員郵件</h3>
                  <div>{tempUserData.email}</div>
                </div>
                <div className="d-flex align-items-center gap-6">
                  <h3 className="fs-base">宅配地址</h3>
                  <div>{tempUserData.address}</div>
                </div>
              </div>

              {tempUserData?.orders?.length > 0 ? (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th scope="col">訂單編號</th>
                        <th scope="col">購買時間</th>
                        <th scope="col">購買項目</th>
                        <th scope="col">應付金額</th>
                        <th scope="col">是否付款</th>
                        <th scope="col">運送狀態</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {tempUserData?.orders?.map((order) => (
                        <tr key={order.id}>
                          <th scope="row">{order.id}</th>
                          <td>{order.orderDate}</td>
                          <td>
                            <ul className="flex flex-wrap gap-2">
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
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => openOrderModal(order)}
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
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="alert bg-nature-95">未找到訂單</div>
              )}
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
      <div
        className="modal fade"
        id="adminOrderModal"
        tabIndex="-1"
        aria-labelledby="adminOrderModalLabel"
        aria-modal="true"
        ref={orderModalRef}
      >
        <div className="modal-dialog modal-xl modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-h3" id="adminOrderModalLabel">
                訂單資料
              </h1>
              <button
                type="button"
                className="btn-close"
                onClick={closeOrderModal}
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body p-6">
              <FormTitle
                title="訂單細節"
                titleBgColor={'bg-nature-80'}
                borderColor={'border-nature-80'}
              />
              <div className="d-flex flex-column gap-5 bg-white py-8 px-5 border border-nature-95 mb-10">
                <div className="d-flex align-items-center gap-6">
                  <h3 className="fs-base">訂單編號</h3>
                  <div>{tempOrderData.id}</div>
                </div>
                <div className="d-flex align-items-center gap-6">
                  <h3 className="fs-base">下單時間</h3>
                  <div>{tempOrderData.orderDate}</div>
                </div>
                <div className="d-flex align-items-center gap-6">
                  <h3 className="fs-base">付款狀態</h3>
                  <div>{tempOrderData.is_paid ? '已付款' : '未付款'}</div>
                </div>
                <div className="d-flex align-items-center gap-6">
                  <h3 className="fs-base">商品原價金額</h3>
                  <div>{tempOrderData.total}</div>
                </div>
                <div className="d-flex align-items-center gap-6">
                  <h3 className="fs-base">結帳金額</h3>
                  <div>{tempOrderData.final_total}</div>
                </div>
                <div className="d-flex align-items-center gap-6">
                  <h3 className="fs-base">運送狀態</h3>
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
                  defaultValue={tempOrderData.is_paid}
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
                onClick={closeOrderModal}
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
