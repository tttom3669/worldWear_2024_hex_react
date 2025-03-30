import { useState, useEffect, useRef } from "react";
import useSwal from "../../hooks/useSwal";
import cookieUtils from "../../components/tools/cookieUtils";
import Pagination from "../../components/layouts/Pagination";
import ProductModal from "../../components/admin/ProductModal";
import DeleteProductModal from "../../components/admin/DeleteProductModal";

// const { VITE_API_PATH: API_PATH } = import.meta.env;

const defaultModalState = () => ({
  class: "",
  category: "",
  categoryItems: "",
  title: "",
  content: {
    design_style:"",
    design_introduction:"",
    origin:"",
  },
  description:"",
  clean:{
    method1: "",
    method2: "",
    method3: "",
    method4: ""
  },
  productSizeRef: "",
  is_enabled: 0,
  status: "",
  is_hot: 0,
  origin_price: "",
  price: "",
  unit: "",
  color: [],
  num: [],
  size: [],
  imageUrl: "",
  imagesUrl: [],
  id: "",
});

const AdminProducts = () => {
  const { toastAlert } = useSwal();
  const [products, setProducts] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [tempProduct, setTempProduct] = useState(defaultModalState());
  const [modalMode, setModalMode] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isDeleteProductModalOpen, setIsDeleteProductModalOpen] =
    useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // 狀態選項
  const statusOptions = ["現貨", "預購", "補貨中"];
  const getProducts = async () => {
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

  // 獲取商品列表
  useEffect(() => {
    getProducts();
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
  const handleOpenProductModal = (mode, product) => {
    setModalMode(mode);
    switch (mode) {
      case 'create':
        setTempProduct(defaultModalState);
        break;
      case 'edit':
        setTempProduct(product);
        break;
      default:
        break;
    }
    setIsProductModalOpen(true); // 傳入狀態給子原件商品 modal，透過傳入狀態打開 modal
  };

  const handleOpenDelProductModal = (product) => {
    setTempProduct(product); // 將該項的商品資料寫入
    setIsDeleteProductModalOpen(true); // 傳入狀態給子原件商品 modal，透過傳入狀態打開 modal
  };

  return (
    <>
      <title>商品管理 - WorldWear</title>
      <div className="container-fluid p-10 h-100">
        <div className="row align-items-center mb-6">
          <div className="col-md-2">
            <h1 className="fs-h4 mb-4">所有商品</h1>
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
                handleOpenProductModal('create');
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
                    <th style={{ width: "11%" }}>類別</th>
                    <th style={{ width: "11%" }}>商品編號</th>
                    <th style={{ width: "11%" }}>商品名稱</th>
                    <th style={{ width: "11%" }}>狀態</th>
                    <th style={{ width: "11%" }}>定價</th>
                    <th style={{ width: "11%" }}>售價</th>
                    <th style={{ width: "11%" }}>庫存數量</th>
                    <th style={{ width: "11%" }}>已售數量</th>
                    <th style={{ width: "12%" }}>編輯功能</th>
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
                        <td>{product.class}</td>
                        <td>{product.id}</td>
                        <td className="text-start">{product.title}</td>
                        <td>{product.status}</td>
                        <td>${product.origin_price}</td>
                        <td>${product.price}</td>
                        <td>-</td>
                        <td>-</td>
                        <td>
                          <button
                            className="btn btn-sm btn-primary me-2"
                            onClick={() => {
                              handleOpenProductModal('edit', product);
                            }}
                            type="button"
                          >
                            修改
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleOpenDelProductModal(product)}
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
        <ProductModal
        modalMode={modalMode}
        tempProduct={tempProduct}
        isOpen={isProductModalOpen}
        setIsOpen={setIsProductModalOpen}
        getProducts={getProducts}
      />
        {/* 刪除 modal */}
        <DeleteProductModal
        tempProduct={tempProduct}
        getProducts={getProducts}
        isOpen={isDeleteProductModalOpen}
        setIsOpen={setIsDeleteProductModalOpen}
      />
      </div>
    </>
  );
};

export default AdminProducts;
