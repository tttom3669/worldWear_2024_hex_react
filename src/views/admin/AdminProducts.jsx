import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import useSwal from "../../hooks/useSwal";
import axios from "axios";
import cookieUtils from "../../components/tools/cookieUtils";
import Pagination from "../../components/layouts/Pagination";

const { VITE_API_PATH: API_PATH } = import.meta.env;

const AdminProducts = () => {
  const dispatch = useDispatch();
  const { toastAlert } = useSwal();
  const [products, setProducts] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // 狀態選項
  const statusOptions = ["現貨", "預購", "補貨中"];

  // 獲取商品列表
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const authAxios = cookieUtils.createAuthAxios();
        const response = await authAxios.get("/products");
        const productsData = Array.isArray(response.data) ? response.data : [];
        setProducts(productsData);
      } catch (error) {
        console.error("獲取商品列表失敗:", error);
        toastAlert({
          icon: "error",
          title: "獲取商品列表失敗",
        });
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // 搜尋功能
  const filteredProducts = (products || []).filter((product) => {
    if (!product) return false;
    const matchesText = searchText
      ? product.id?.toLowerCase()?.includes(searchText.toLowerCase()) ||
        product.title?.toLowerCase()?.includes(searchText.toLowerCase())
      : true;
    const matchesStatus = searchStatus ? product.status === searchStatus : true;
    return matchesText && matchesStatus;
  });

  // 處理頁面變更
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 處理新增/編輯商品
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const authAxios = cookieUtils.createAuthAxios();
      if (editingProduct) {
        // 更新商品
        await authAxios.put(`/products/${editingProduct.id}`, editingProduct);
        toastAlert({
          icon: "success",
          title: "商品更新成功",
        });
      } else {
        // 新增商品
        await authAxios.post("/products", editingProduct);
        toastAlert({
          icon: "success",
          title: "商品新增成功",
        });
      }
      setShowModal(false);
      setEditingProduct(null);
      // 重新獲取商品列表
      const response = await authAxios.get("/products");
      const productsData = Array.isArray(response.data) ? response.data : [];
      setProducts(productsData);
    } catch (error) {
      console.error("操作失敗:", error);
      toastAlert({
        icon: "error",
        title: "操作失敗",
      });
    }
  };

  // 處理刪除商品
  const handleDelete = async (id) => {
    try {
      const authAxios = cookieUtils.createAuthAxios();
      await authAxios.delete(`/products/${id}`);
      toastAlert({
        icon: "success",
        title: "商品刪除成功",
      });
      // 重新獲取商品列表
      const response = await authAxios.get("/products");
      const productsData = Array.isArray(response.data) ? response.data : [];
      setProducts(productsData);
    } catch (error) {
      console.error("刪除失敗:", error);
      toastAlert({
        icon: "error",
        title: "刪除失敗",
      });
    }
  };

  return (
    <>
      <title>商品管理 - WorldWear</title>
      <div className="container-fluid mt-4">
        <div className="row align-items-center mb-4">
          <div className="col-md-2">
            <h2 className="mb-0">所有商品</h2>
          </div>
          <div className="col-md-4">
            <input
              type="text"
              className="form-control"
              placeholder="搜尋商品編號或名稱"
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
                setEditingProduct(null);
                setShowModal(true);
              }}
            >
              <i className="bi bi-plus-lg"></i> 新增商品
            </button>
          </div>
        </div>

        {/* 商品列表 */}
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
                    <th className="text-center" style={{ width: "11%" }}>
                      類別
                    </th>
                    <th className="text-center" style={{ width: "11%" }}>
                      商品編號
                    </th>
                    <th className="text-center" style={{ width: "11%" }}>
                      商品名稱
                    </th>
                    <th className="text-center" style={{ width: "11%" }}>
                      狀態
                    </th>
                    <th className="text-center" style={{ width: "11%" }}>
                      定價
                    </th>
                    <th className="text-center" style={{ width: "11%" }}>
                      售價
                    </th>
                    <th className="text-center" style={{ width: "11%" }}>
                      庫存數量
                    </th>
                    <th className="text-center" style={{ width: "11%" }}>
                      已售數量
                    </th>
                    <th className="text-center" style={{ width: "12%" }}>
                      編輯功能
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts
                    .slice(
                      (currentPage - 1) * itemsPerPage,
                      currentPage * itemsPerPage
                    )
                    .map((product) => (
                      <tr key={product.id}>
                        <td className="text-center">{product.class}</td>
                        <td className="text-center">{product.id}</td>
                        <td className="text-start">{product.title}</td>
                        <td className="text-center">{product.status}</td>
                        <td className="text-center">${product.origin_price}</td>
                        <td className="text-center">${product.price}</td>
                        <td className="text-center">-</td>
                        <td className="text-center">-</td>
                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-primary me-2"
                            onClick={() => {
                              setEditingProduct(product);
                              setShowModal(true);
                            }}
                          >
                            修改
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(product.id)}
                          >
                            刪除
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {Math.ceil(filteredProducts.length / itemsPerPage) > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <Pagination
                    data={filteredProducts}
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

        {/* 新增/編輯商品彈窗 */}
        {showModal && (
          <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editingProduct ? "編輯商品" : "新增商品"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setShowModal(false);
                      setEditingProduct(null);
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleProductSubmit}>
                    {/* 這裡可以根據需求添加表單欄位 */}
                    <div className="mb-3">
                      <label className="form-label">商品名稱</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editingProduct?.title || ""}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            title: e.target.value,
                          })
                        }
                      />
                    </div>
                    {/* 其他表單欄位... */}
                    <div className="text-end">
                      <button
                        type="button"
                        className="btn btn-secondary me-2"
                        onClick={() => {
                          setShowModal(false);
                          setEditingProduct(null);
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
};

export default AdminProducts;
