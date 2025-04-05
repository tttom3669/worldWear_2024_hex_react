import { useState, useEffect, useCallback, useRef, useMemo} from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import useSwal from "../../hooks/useSwal";
import Pagination from "../../components/layouts/Pagination";
import ProductModal from "../../components/admin/ProductModal";
import DeleteProductModal from "../../components/admin/DeleteProductModal";
import ScreenLoading from "../../components/front/ScreenLoading";

const { VITE_API_PATH: API_PATH } = import.meta.env;

const defaultModalState = {
  class: "",
  category: "",
  categoryItems: "",
  title: "",
  content: {
    design_style: "",
    design_introduction: "",
    origin: "",
  },
  description: "",
  clean: {
    method1: "",
    method2: "",
    method3: "",
    method4: "",
  },
  productSizeRef: "",
  is_enabled: 0,
  status: "",
  is_hot: 0,
  origin_price: "",
  price: "",
  unit: "",
  color: [],
  num: {},
  size: [],
  imageUrl: "",
  imagesUrl: [],
  id: "",
};

const AdminProducts = () => {
  const { toastAlert } = useSwal();
  const [products, setProducts] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [tempProduct, setTempProduct] = useState(defaultModalState);
  const [modalMode, setModalMode] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isDeleteProductModalOpen, setIsDeleteProductModalOpen] =
    useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const token = useSelector((state) => state.authSlice.token);

  // 狀態選項
  const statusOptions = ["現貨", "預購", "補貨中"];

  // 使用 useRef 來存儲 token 和 toastAlert 的最新值
  const tokenRef = useRef(token);
  const toastAlertRef = useRef(toastAlert);

  // 當值變化時更新 refs
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    toastAlertRef.current = toastAlert;
  }, [toastAlert]);

  // 定義 getProducts 函數
  const getProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_PATH}/admin/products`, {
        headers: {
          authorization: tokenRef.current,
        },
      });
      console.log(res.data);
  
      let productsData = [];
      if (res.data && Array.isArray(res.data)) {
        productsData = res.data;
      } else if (res.data && Array.isArray(res.data.products)) {
        productsData = res.data.products;
      } else if (res.data && typeof res.data === "object") {
        console.log("API 回應結構:", Object.keys(res.data));
      }
  
      // 反轉商品列表順序，使最新新增的商品顯示在最前面
      const reversedProducts = [...productsData].reverse();
      
      setProducts(reversedProducts);
    } catch (error) {
      toastAlertRef.current({
        icon: "error",
        title: error.response?.data || "獲取商品列表失敗",
      });
  
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 在組件掛載時調用 getProducts
  useEffect(() => {
    getProducts();
  }, [getProducts]);

  // 搜尋功能
  const filteredProducts = useMemo(() => {
    return (products || []).filter((product) => {
      if (!product) return false;
      
      // 文字搜尋，檢查 ID 和商品名稱
      const matchesText = searchText
        ? (product.id?.toString().toLowerCase().includes(searchText.toLowerCase()) ||
           product.title?.toString().toLowerCase().includes(searchText.toLowerCase()))
        : true;
      
      // 狀態篩選
      const matchesStatus = searchStatus 
        ? product.status === searchStatus
        : true;
      
      return matchesText && matchesStatus;
    });
  }, [products, searchText, searchStatus]);

  // 處理狀態變更
  const handleStatusChange = (e) => {
    setSearchStatus(e.target.value);
  };

  // 處理文字搜尋變更
  const handleSearchTextChange = (e) => {
    setSearchText(e.target.value);
  };

  // 處理頁面變更
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleOpenProductModal = (mode, product) => {
    setModalMode(mode);
    switch (mode) {
      case "create":
        setTempProduct({ ...defaultModalState });
        break;

      case "edit":
        // 在編輯模式下，先重新獲取該產品的最新數據
        if (product && product.id) {
          const getProductDetail = async (productId) => {
            try {
              const res = await axios.get(
                `${API_PATH}/admin/products/${productId}`,
                {
                  headers: {
                    authorization: token,
                  },
                }
              );
              setTempProduct(res.data.product || res.data);
            } catch (error) {
              console.error("獲取產品詳情失敗", error);
              setTempProduct(JSON.parse(JSON.stringify(product)));
            }
          };

          getProductDetail(product.id);
        } else {
          setTempProduct({ ...product });
        }
        break;

      default:
        break;
    }
    setIsProductModalOpen(true);
  };

  const handleOpenDelProductModal = (product) => {
    setTempProduct(product);
    setIsDeleteProductModalOpen(true);
  };

  // 計算總庫存數量
  const calculateTotalStock = (stockObj) => {
    if (!stockObj) return 0;

    let total = 0;
    Object.keys(stockObj).forEach((color) => {
      Object.keys(stockObj[color]).forEach((size) => {
        total += parseInt(stockObj[color][size], 10) || 0;
      });
    });

    return total;
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
              // onChange={(e) => setSearchText(e.target.value)}
              onChange={handleSearchTextChange}
            />
          </div>
          <div className="col-md-4">
            <select
              className="form-select"
              value={searchStatus}
              // onChange={(e) => setSearchStatus(e.target.value)}
              onChange={handleStatusChange}
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
                handleOpenProductModal("create");
              }}
            >
              <i className="bi bi-plus-lg"></i> 新增商品
            </button>
          </div>
        </div>
        {/* 商品列表 */}
        <div className="table-responsive">
          <>
            <table className="table table-hover">
              <thead>
                <tr>
                  <th style={{ width: "7%" }}>類別</th>
                  <th style={{ width: "20%" }}>商品編號</th>
                  <th style={{ width: "20%" }}>商品名稱</th>
                  <th style={{ width: "10%" }}>狀態</th>
                  <th style={{ width: "10%" }}>定價</th>
                  <th style={{ width: "10%" }}>售價</th>
                  <th style={{ width: "9%" }}>庫存數量</th>
                  {/* <th style={{ width: "9%" }}>已售數量</th> */}
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
                      <td>{product.num ? calculateTotalStock(product.num) : 0}</td>
                      {/* <td>-</td> */}
                      <td>
                        <button
                          className="btn btn-sm btn-primary me-2"
                          onClick={() => {
                            handleOpenProductModal("edit", product);
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
      <ScreenLoading isLoading={isLoading} />
    </>
  );
};

export default AdminProducts;
