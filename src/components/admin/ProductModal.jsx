import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { Modal } from "bootstrap";
import axios from "axios";
import useSwal from "../../hooks/useSwal";
import PropTypes from "prop-types";

const { VITE_API_PATH: API_PATH } = import.meta.env;

const ProductModal = ({
  modalMode,
  tempProduct,
  isOpen,
  setIsOpen,
  getProducts,
}) => {
  const token = useSelector((state) => state.authSlice.token);
  const [modalData, setModalData] = useState(tempProduct);
  useEffect(() => {
    setModalData({
      ...tempProduct,
    });
  }, [tempProduct]);

  const { toastAlert } = useSwal();

  // 用於儲存 modal 實體
  const productModalRef = useRef(null);
  useEffect(() => {
    new Modal(productModalRef.current, {
      backdrop: false,
    });
  }, []);

  // 監聽 isOpen 值狀態，如果為 true 則打開 modal
  useEffect(() => {
    if (isOpen) {
      const modalInstance = Modal.getInstance(productModalRef.current);
      modalInstance.show();
    }
  }, [isOpen]);

  // 關閉 modal 方法
  const handleCloseProductModal = () => {
    const modalInstance = Modal.getInstance(productModalRef.current);
    modalInstance.hide();
    setIsOpen(false);
  };
  
  const handleModalInputChange = (e) => {
    const { value, name, checked, type } = e.target;
  
    // 擴展 contentFields 列表，包含所有 content 對象下的屬性
    const contentFields = [
      "material_contents",
      "notes",
      "origin",
      "shelf_life",
      "design_style",
      "design_introduction"
    ];
    
    // 添加 clean 字段列表
    const cleanFields = [
      "method1",
      "method2",
      "method3",
      "method4"
    ];
  
    const isContentField = contentFields.includes(name);
    const isCleanField = cleanFields.includes(name);
  
    // 設置輸入值
    const inputValue = type === "checkbox" ? checked : value;
  
    // 使用回呼函式保證可取得最新狀態
    setModalData((prevProduct) => {
      // 創建新的對象，避免直接修改原對象
      const newProduct = { ...prevProduct };
      
      if (isContentField) {
        // 確保 content 對象存在
        newProduct.content = newProduct.content || {};
        // 創建 content 的副本來避免直接修改
        newProduct.content = {
          ...newProduct.content,
          [name]: inputValue
        };
      } else if (isCleanField) {
        // 確保 clean 對象存在
        newProduct.clean = newProduct.clean || {};
        // 創建 clean 的副本來避免直接修改
        newProduct.clean = {
          ...newProduct.clean,
          [name]: inputValue
        };
      } else {
        // 直接更新最外層屬性
        newProduct[name] = inputValue;
      }
      
      return newProduct;
    });
  };

  // 控制與寫入商品圖片資料
  const handleImageChange = (e, index) => {
    const { value } = e.target;
    const newImages = [...modalData.imagesUrl];

    newImages[index] = value;

    setModalData({
      ...modalData,
      imagesUrl: newImages,
    });
  };

  // 新增商品附圖資料
  const handleAddImage = () => {
    const newImages = [...modalData.imagesUrl, ""];
    setModalData({
      ...modalData,
      imagesUrl: newImages,
    });
  };

  // 刪除商品品附圖資料
  const handleRemoveImage = () => {
    const newImages = [...modalData.imagesUrl];
    newImages.pop();

    setModalData({
      ...modalData,
      imagesUrl: newImages,
    });
  };

  //新增商品資料方法
  const createProduct = async () => {
    try {
      await axios.post(
        `${API_PATH}/admin/products`,
        {
          data: {
            ...modalData,
            origin_price: Number(modalData.origin_price),
            price: Number(modalData.price),
            is_enabled: modalData.is_enabled ? 1 : 0,
          },
        },
        {
          headers: {
            authorization: token,
          },
        }
      );

      toastAlert({
        icon: "success",
        title: "新增產品成功",
      });
      handleCloseProductModal();
    } catch (error) {
      toastAlert({
        icon: "error",
        title: error.response?.data?.message || "新增產品失敗",
      });
    }
  };

  //編輯現有商品資料方法
  const updateProduct = async () => {
    try {
      await axios.patch(`${API_PATH}/admin/products/${modalData.id}`, {
        data: {
          ...modalData,
          origin_price: Number(modalData.origin_price),
          price: Number(modalData.price),
          is_enabled: modalData.is_enabled ? 1 : 0,
        },
      });
      toastAlert({
        icon: "success",
        title: "修改產品成功",
      });
      handleCloseProductModal();
    } catch (error) {
      console.error(error);
      toastAlert({
        icon: "error",
        title: "編輯產品失敗",
      });
    }
  };

  // 控制商品資料 - 編輯或新增
  const handleUpdateProduct = async () => {
    const apiCall = modalMode === "create" ? createProduct : updateProduct;
    try {
      await apiCall();
      getProducts();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <div
        id="productModal"
        ref={productModalRef}
        className="modal"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <div className="modal-dialog modal-dialog-centered modal-xl">
          <div className="modal-content border-0 shadow">
            <div className="modal-header border-bottom">
              <h5 className="modal-title fs-4">
                {modalMode === "create" ? "新增產品" : "編輯產品"}
              </h5>
              <button
                onClick={handleCloseProductModal}
                type="button"
                className="btn-close"
                aria-label="Close"
              ></button>
            </div>

            <div className="modal-body p-4">
              <div className="row g-4">
                <div className="col-md-4 mb-4">
                  <div className="mb-4">
                    <label htmlFor="primary-image" className="form-label mb-2">
                      主圖
                    </label>
                    <div className="input-group mb-2">
                      <input
                        value={modalData.imageUrl}
                        onChange={handleModalInputChange}
                        name="imageUrl"
                        type="text"
                        id="primary-image"
                        className="form-control"
                        placeholder="請輸入圖片連結"
                      />
                    </div>
                    {modalData.imageUrl ? (
                      <img
                        src={modalData.imageUrl}
                        alt={modalData.title || "商品圖片"}
                        className="img-fluid"
                      />
                    ) : null}
                  </div>

                  {/* 副圖 */}
                  <div className="border border-2 border-dashed rounded-3 p-3">
                    {modalData.imagesUrl?.map((image, index) => (
                      <div key={index} className="mb-2">
                        <label
                          htmlFor={`imagesUrl-${index + 1}`}
                          className="form-label"
                        >
                          副圖 {index + 1}
                        </label>
                        <input
                          value={image}
                          onChange={(e) => {
                            handleImageChange(e, index);
                          }}
                          id={`imagesUrl-${index + 1}`}
                          type="text"
                          placeholder={`圖片網址 ${index + 1}`}
                          className="form-control mb-2"
                        />
                        {image && image.trim() !== "" ? (
                          <img
                            src={image}
                            alt={`副圖 ${index + 1}`}
                            className="img-fluid mb-2"
                          />
                        ) : null}
                      </div>
                    ))}
                    <div className="btn-group w-100">
                      {modalData &&
                        modalData.imagesUrl &&
                        modalData.imagesUrl.length < 5 &&
                        modalData.imagesUrl[modalData.imagesUrl.length - 1] !==
                          "" && (
                          <button
                            onClick={handleAddImage}
                            className="btn btn-outline-primary btn-sm w-100"
                          >
                            新增圖片
                          </button>
                        )}
                      {modalData &&
                        modalData.imagesUrl &&
                        modalData.imagesUrl.length > 1 && (
                          <button
                            onClick={handleRemoveImage}
                            className="btn btn-outline-danger btn-sm w-100"
                          >
                            取消圖片
                          </button>
                        )}
                    </div>
                  </div>
                </div>

                <div className="col-md-8">
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label htmlFor="class" className="form-label">
                        商品主題
                      </label>
                      <input
                        value={modalData.class}
                        onChange={handleModalInputChange}
                        name="class"
                        id="class"
                        type="text"
                        className="form-control"
                        placeholder="請輸入商品主題"
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">
                      商品名稱
                    </label>
                    <input
                      value={modalData.title}
                      onChange={handleModalInputChange}
                      name="title"
                      id="title"
                      type="text"
                      className="form-control"
                      placeholder="請輸入商品名稱"
                    />
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label htmlFor="category" className="form-label">
                        商品類別
                      </label>
                      <input
                        value={modalData.category}
                        onChange={handleModalInputChange}
                        name="category"
                        id="category"
                        type="text"
                        className="form-control"
                        placeholder="請輸入商品類別"
                        min="0"
                      />
                    </div>
                    <div className="col-6 mb-3">
                      <label htmlFor="categoryItems" className="form-label">
                        商品類別細項
                      </label>
                      <input
                        value={modalData.categoryItems}
                        onChange={handleModalInputChange}
                        name="categoryItems"
                        id="categoryItems"
                        type="text"
                        className="form-control"
                        placeholder="請輸入商品類別細項"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="design_style" className="form-label">
                      商品穿搭風格
                    </label>
                    <input
                      value={modalData?.content?.design_style || ''}
                      onChange={handleModalInputChange}
                      name="design_style"
                      id="design_style"
                      type="text"
                      className="form-control"
                      placeholder="請輸入穿搭風格"
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="design_introduction" className="form-label">
                      商品介紹
                    </label>
                    <input
                      value={modalData?.content?.design_introduction || ''}
                      onChange={handleModalInputChange}
                      name="design_introduction"
                      id="design_introduction"
                      type="text"
                      className="form-control"
                      placeholder="請輸入產品介紹"
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="origin" className="form-label">
                      產地
                    </label>
                    <input
                      value={modalData?.content?.origin|| ''}
                      onChange={handleModalInputChange}
                      name="origin"
                      id="origin"
                      type="text"
                      className="form-control"
                      placeholder="請輸入產地"
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="unit" className="form-label">
                      單位
                    </label>
                    <input
                      value={modalData.unit}
                      onChange={handleModalInputChange}
                      name="unit"
                      id="unit"
                      type="text"
                      className="form-control"
                      placeholder="請輸入單位"
                    />
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label htmlFor="origin_price" className="form-label">
                        原價
                      </label>
                      <input
                        value={modalData.origin_price}
                        onChange={handleModalInputChange}
                        name="origin_price"
                        id="origin_price"
                        type="number"
                        className="form-control"
                        placeholder="請輸入原價"
                        min="0"
                      />
                    </div>
                    <div className="col-6">
                      <label htmlFor="price" className="form-label">
                        售價
                      </label>
                      <input
                        value={modalData.price}
                        onChange={handleModalInputChange}
                        name="price"
                        id="price"
                        type="number"
                        className="form-control"
                        placeholder="請輸入售價"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">
                      產品描述
                    </label>
                    <textarea
                      value={modalData.content?.design_introduction}
                      onChange={handleModalInputChange}
                      name="description"
                      id="description"
                      className="form-control"
                      rows={4}
                      placeholder="請輸入產品描述"
                    ></textarea>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="method1" className="form-label">
                      商品清洗方式1:
                    </label>
                    <textarea
                      value={modalData.clean?.method1}
                      onChange={handleModalInputChange}
                      name="method1"
                      id="method1"
                      className="form-control"
                      rows={1}
                      placeholder="請輸入商品清洗方式"
                    ></textarea>
                    <label htmlFor="method2" className="form-label">
                      商品清洗方式2:
                    </label>
                    <textarea
                      value={modalData.clean?.method2}
                      onChange={handleModalInputChange}
                      name="method2"
                      id="method2"
                      className="form-control"
                      rows={1}
                      placeholder="請輸入商品清洗方式"
                    ></textarea>
                    <label htmlFor="method3" className="form-label">
                      商品清洗方式3:
                    </label>
                    <textarea
                      value={modalData.clean?.method3}
                      onChange={handleModalInputChange}
                      name="method3"
                      id="method3"
                      className="form-control"
                      rows={1}
                      placeholder="請輸入商品清洗方式"
                    ></textarea>
                    <label htmlFor="method4" className="form-label">
                      商品清洗方式4:
                    </label>
                    <textarea
                      value={modalData.clean?.method4}
                      onChange={handleModalInputChange}
                      name="method4"
                      id="method4"
                      className="form-control"
                      rows={1}
                      placeholder="請輸入商品清洗方式"
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="status" className="form-label">
                      購買狀態
                    </label>
                    <input
                      value={modalData.status}
                      onChange={handleModalInputChange}
                      name="status"
                      id="status"
                      type="text"
                      className="form-control"
                      placeholder="請輸入購買狀態"
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="color" className="form-label">
                      商品顏色
                    </label>
                    <input
                      value={modalData.color}
                      onChange={handleModalInputChange}
                      name="color"
                      id="color"
                      type="text"
                      className="form-control"
                      placeholder="請輸入商品顏色"
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="size" className="form-label">
                      尺寸大小
                    </label>
                    <input
                      value={modalData.size}
                      onChange={handleModalInputChange}
                      name="size"
                      id="size"
                      type="text"
                      className="form-control"
                      placeholder="請設定商品尺寸大小"
                    />
                  </div>
                  <div className="form-check">
                    <input
                      checked={modalData.is_enabled}
                      onChange={handleModalInputChange}
                      name="is_enabled"
                      type="checkbox"
                      className="form-check-input"
                      id="isEnabled"
                    />
                    <label className="form-check-label" htmlFor="isEnabled">
                      啟用商品
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer border-top bg-light">
              <button
                onClick={handleCloseProductModal}
                type="button"
                className="btn btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleUpdateProduct}
                type="button"
                className="btn btn-primary"
              >
                確認
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

ProductModal.propTypes = {
  modalMode: PropTypes.string.isRequired,
  tempProduct: PropTypes.object.isRequired,
  isOpen: PropTypes.bool.isRequired,
  setIsOpen: PropTypes.func.isRequired,
  getProducts: PropTypes.func.isRequired,
};

export default ProductModal;
