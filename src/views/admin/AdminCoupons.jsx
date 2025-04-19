import { useState, useEffect, useCallback } from 'react';
import useSwal from '../../hooks/useSwal';
import cookieUtils from '../../components/tools/cookieUtils';
import { convertTimestampToDate } from '../../components/tools/dateUtils';
import Pagination from '../../components/layouts/Pagination';

export default function AdminCoupons() {
  const { toastAlert } = useSwal();
  const [coupons, setCoupons] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // 狀態選項
  const statusOptions = ['已啟用', '未啟用'];
  // 取得折價券列表
  const fetchCoupons = useCallback(async () => {
    try {
      setIsLoading(true);
      const authAxios = cookieUtils.createAuthAxios();
      const response = await authAxios.get('/coupons');
      const couponsData = Array.isArray(response.data) ? response.data : [];
      setCoupons(couponsData);
    } catch (error) {
      toastAlert({
        icon: 'error',
        title: error.message || '取得折價券列表失敗',
      });
      setCoupons([]);
    } finally {
      setIsLoading(false);
    }
  },[toastAlert]);

  // 取得折價券列表
  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  // 搜尋功能
  const filteredCoupons = (coupons || []).filter((coupon) => {
    if (!coupon) return false;

    const matchesText = searchText
      ? coupon.id?.toLowerCase()?.includes(searchText.toLowerCase()) ||
        coupon.title?.toLowerCase()?.includes(searchText.toLowerCase())
      : true;

    const matchesStatus = searchStatus
      ? coupon.is_enabled === (searchStatus === '已啟用')
      : true;

    return matchesText && matchesStatus;
  });

  // 處理頁面變更
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 新增/編輯折價券
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const authAxios = cookieUtils.createAuthAxios();
      if (isEdit) {
        // 更新折價券
        await authAxios.patch(`/coupons/${editingCoupon.id}`, editingCoupon);
        toastAlert({
          icon: 'success',
          title: '折價券更新成功',
        });
      } else {
        // 新增折價券
        await authAxios.post('/coupons', editingCoupon);
        toastAlert({
          icon: 'success',
          title: '折價券新增成功',
        });
      }
      setShowModal(false);
      setEditingCoupon(null);
      // 重新獲取折價券列表
      const response = await authAxios.get('/coupons');
      const productsData = Array.isArray(response.data) ? response.data : [];
      setCoupons(productsData);
    } catch (error) {
      toastAlert({
        icon: 'error',
        title: error.message || '操作失敗',
      });
    }
  };

  // 刪除折價券
  const handleDelete = async (id) => {
    try {
      const authAxios = cookieUtils.createAuthAxios();
      await authAxios.delete(`/coupons/${id}`);
      toastAlert({
        icon: 'success',
        title: '折價券刪除成功',
      });
      // 重新獲取折價券列表
      const response = await authAxios.get('/coupons');
      const couponsData = Array.isArray(response.data) ? response.data : [];
      setCoupons(couponsData);
    } catch (error) {
      toastAlert({
        icon: 'error',
        title: error.message || '刪除失敗',
      });
    }
  };

  return (
    <>
      <title>折價券管理 - WorldWear</title>
      <div className="container-fluid mt-4">
        <div className="row align-items-center mb-4">
          <div className="col-md-2">
            <h2 className="mb-0">所有折價券</h2>
          </div>
          <div className="col-md-4">
            <input
              type="text"
              className="form-control"
              placeholder="搜尋折價券編號或名稱"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <select
              className="form-select"
              value={searchStatus}
              onChange={(e) => setSearchStatus(e.target.value)}
            >
              <option value="">所有狀態</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2 text-end">
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditingCoupon(null);
                setIsEdit(false);
                setShowModal(true);
              }}
            >
              <i className="bi bi-plus-lg"></i> 新增折價券
            </button>
          </div>
        </div>

        {/* 折價券列表 */}
        <div className="table-responsive">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">載入中...</span>
              </div>
            </div>
          ) : (
            <>
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th className="text-center" style={{ width: '16%' }}>
                      折價券編號
                    </th>
                    <th className="text-center" style={{ width: '14%' }}>
                      折價券名稱
                    </th>
                    <th className="text-center" style={{ width: '11%' }}>
                      折扣代碼
                    </th>
                    <th className="text-center" style={{ width: '11%' }}>
                      折扣百分比 (%)
                    </th>
                    <th className="text-center" style={{ width: '11%' }}>
                      起始日
                    </th>
                    <th className="text-center" style={{ width: '11%' }}>
                      到期日
                    </th>
                    <th className="text-center" style={{ width: '10%' }}>
                      是否啟用
                    </th>
                    <th className="text-center" style={{ width: '12%' }}>
                      編輯功能
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCoupons
                    .slice(
                      (currentPage - 1) * itemsPerPage,
                      currentPage * itemsPerPage
                    )
                    .map((coupon) => (
                      <tr key={coupon.id}>
                        <td className="text-center">{coupon.id}</td>
                        <td className="text-center">{coupon.title}</td>
                        <td className="text-center">{coupon.code}</td>
                        <td className="text-center">{coupon.percent}</td>
                        <td className="text-center">
                          {convertTimestampToDate(coupon.start_date)}
                        </td>
                        <td className="text-center">
                          {convertTimestampToDate(coupon.due_date)}
                        </td>
                        <td className="text-center">
                          {coupon.is_enabled ? '已啟用' : '未啟用'}
                        </td>
                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-primary me-2"
                            onClick={() => {
                              setEditingCoupon(coupon);
                              setIsEdit(true);
                              setShowModal(true);
                            }}
                          >
                            修改
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(coupon.id)}
                          >
                            刪除
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {Math.ceil(filteredCoupons.length / itemsPerPage) > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <Pagination
                    data={filteredCoupons}
                    RenderComponent={() => null}
                    pageLimit={5}
                    dataLimit={itemsPerPage}
                    currentPage={currentPage}
                    setCurrentPage={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* 新增/編輯折價券彈窗 */}
        {showModal && (
          <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {isEdit ? '編輯折價券' : '新增折價券'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setShowModal(false);
                      setEditingCoupon(null);
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleProductSubmit}>
                    <div className="mb-3">
                      <label className="form-label">折價券名稱</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editingCoupon?.title || ''}
                        onChange={(e) =>
                          setEditingCoupon({
                            ...editingCoupon,
                            title: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">折扣代碼</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editingCoupon?.code || ''}
                        onChange={(e) =>
                          setEditingCoupon({
                            ...editingCoupon,
                            code: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">折扣百分比 (%)</label>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        max="100"
                        value={editingCoupon?.percent || ''}
                        onChange={(e) =>
                          setEditingCoupon({
                            ...editingCoupon,
                            percent: parseInt(e.target.value, 10),
                          })
                        }
                        required
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label">起始日</label>
                      <input
                        type="date"
                        className="form-control"
                        value={
                          editingCoupon?.start_date
                            ? new Date(editingCoupon.start_date * 1000)
                                .toISOString()
                                .split('T')[0]
                            : ''
                        }
                        onChange={(e) =>
                          setEditingCoupon({
                            ...editingCoupon,
                            start_date: Math.floor(
                              new Date(e.target.value).getTime() / 1000
                            ),
                          })
                        }
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">到期日</label>
                      <input
                        type="date"
                        className="form-control"
                        value={
                          editingCoupon?.due_date
                            ? new Date(editingCoupon.due_date * 1000)
                                .toISOString()
                                .split('T')[0]
                            : ''
                        }
                        onChange={(e) =>
                          setEditingCoupon({
                            ...editingCoupon,
                            due_date: Math.floor(
                              new Date(e.target.value).getTime() / 1000
                            ),
                          })
                        }
                        required
                      />
                    </div>

                    <div className="form-check form-switch mb-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="isEnabledSwitch"
                        checked={editingCoupon?.is_enabled || false}
                        onChange={(e) =>
                          setEditingCoupon({
                            ...editingCoupon,
                            is_enabled: e.target.checked,
                          })
                        }
                      />
                      <label
                        className="form-check-label"
                        htmlFor="isEnabledSwitch"
                      >
                        是否啟用
                      </label>
                    </div>

                    <div className="text-end">
                      <button
                        type="button"
                        className="btn btn-secondary me-2"
                        onClick={() => {
                          setShowModal(false);
                          setEditingCoupon(null);
                        }}
                      >
                        取消
                      </button>
                      <button type="submit" className="btn btn-primary">
                        確定
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
