import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { Modal } from "bootstrap";
import axios from "axios";
import useSwal from "../../hooks/useSwal";
import PropTypes from "prop-types";
import { useOptionStore } from "../tools/useOptionStore";
import { FaPlusCircle } from "react-icons/fa";

const { VITE_API_PATH: API_PATH } = import.meta.env;

const ProductModal = ({
  modalMode,
  tempProduct,
  isOpen,
  setIsOpen,
  getProducts,
}) => {
  const { toastAlert } = useSwal();
  const token = useSelector((state) => state.authSlice.token);
  const [modalData, setModalData] = useState(tempProduct);
  // 總庫存數量狀態
  const [totalStockQuantity, setTotalStockQuantity] = useState(0);

  useEffect(() => {
    setModalData({
      ...tempProduct,
    });
  }, [tempProduct]);

  // 計算庫存總數量
  useEffect(() => {
    const newTotal = calculateTotalStock(modalData.num);
    setTotalStockQuantity(newTotal);
  }, [modalData.num]);

  // 用於儲存 modal 實體
  const productModalRef = useRef(null);

  useEffect(() => {
    new Modal(productModalRef.current, {
      backdrop: false,
    });
  }, []);

  useEffect(() => {
    // 初始化 modal 實例
    if (!productModalRef.current._modal) {
      new Modal(productModalRef.current, {
        backdrop: false,
      });
    }

    // 當 isOpen 為 true 時才執行
    if (isOpen) {
      // 重置所有自訂輸入框的狀態
      setShowCustomStatusInput(false);
      // 深度複製 tempProduct 以確保不會共享引用
      const deepCopy = JSON.parse(JSON.stringify(tempProduct));

      // 確保必要的對象結構都存在
      if (!deepCopy.content) deepCopy.content = {};
      if (!deepCopy.clean) deepCopy.clean = {};
      if (!deepCopy.imagesUrl) deepCopy.imagesUrl = [];

      // 更新 modalData
      setModalData(deepCopy);

      // 顯示 modal
      const modalInstance = Modal.getInstance(productModalRef.current);
      modalInstance.show();
    }
  }, [isOpen, tempProduct]);

  // 關閉 modal 方法
  const handleCloseProductModal = () => {
    const modalInstance = Modal.getInstance(productModalRef.current);
    modalInstance.hide();
    setIsOpen(false);
  };

  const handleModalInputChange = (e) => {
    const { value, name, checked, type } = e.target;
  
    const contentFields = [
      "material_contents",
      "notes",
      "origin",
      "shelf_life",
      "design_style",
      "design_introduction",
    ];
  
    // 添加 clean 字段列表
    const cleanFields = ["method1", "method2", "method3", "method4"];
  
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
          [name]: inputValue,
        };
        
        // 特殊處理 design_introduction 字段，同時更新兩種大小寫版本
        if (name === "design_introduction") {
          newProduct.content.design_Introduction = inputValue;
        } else if (name === "design_Introduction") {
          newProduct.content.design_introduction = inputValue;
        }
      } else if (isCleanField) {
        // 確保 clean 對象存在
        newProduct.clean = newProduct.clean || {};
        // 創建 clean 的副本來避免直接修改
        newProduct.clean = {
          ...newProduct.clean,
          [name]: inputValue,
        };
      } else {
        // 直接更新最外層屬性
        newProduct[name] = inputValue;
        
        // 特殊處理 description 欄位，並將其同步到 content.design_introduction
        if (name === "description") {
          newProduct.content = newProduct.content || {};
          newProduct.content.design_introduction = inputValue;
          newProduct.content.design_Introduction = inputValue;
        }
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
    // 從 num 物件中提取顏色和尺寸
    const colors = Object.keys(modalData.num || {});
    const sizes = new Set();

    // 收集所有尺寸
    colors.forEach(color => {
      if (modalData.num && modalData.num[color]) {
        Object.keys(modalData.num[color]).forEach(size => {
          sizes.add(size);
        });
      }
    });

    // 更新要傳送的資料，添加顏色和尺寸陣列
    const updatedModalData = {
      ...modalData,
      color: colors,
      size: Array.from(sizes),
      origin_price: Number(modalData.origin_price),
      price: Number(modalData.price),
      is_enabled: modalData.is_enabled ? 1 : 0,
    };

    await axios.post(
      `${API_PATH}/admin/products`,
      updatedModalData,
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
    console.error(error);
    toastAlert({
      icon: "error",
      title: "新增產品失敗",
    });
  }
};

//編輯現有商品資料方法
const updateProduct = async () => {
  try {
    await getProducts(); // 刷新數據
    
    // 從 num 物件中提取顏色和尺寸
    const colors = Object.keys(modalData.num || {});
    const sizes = new Set();

    // 收集所有尺寸
    colors.forEach(color => {
      if (modalData.num && modalData.num[color]) {
        Object.keys(modalData.num[color]).forEach(size => {
          sizes.add(size);
        });
      }
    });

    // 更新要傳送的資料，添加顏色和尺寸陣列
    const updatedModalData = {
      ...modalData,
      color: colors,
      size: Array.from(sizes),
      origin_price: Number(modalData.origin_price),
      price: Number(modalData.price),
      is_enabled: modalData.is_enabled ? 1 : 0,
    };
    
    await axios.patch(
      `${API_PATH}/admin/products/${modalData.id}`,
      updatedModalData,
      {
        headers: {
          authorization: token,
        },
      }
    );
    toastAlert({
      icon: "success",
      title: "修改產品成功",
    });
    await getProducts();
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
    await getProducts();
    handleCloseProductModal();
  } catch (error) {
    console.error(error);
  }
};

  // 新增控制自訂輸入框顯示的狀態
  const [showCustomStatusInput, setShowCustomStatusInput] = useState(false);
  const { status, addStatus, sizes, addSize, colors, addColor } =
    useOptionStore();
  const handleAddNewStatus = (newStatus) => {
    if (newStatus && !status.includes(newStatus)) {
      addStatus(newStatus);
    }
  };

  const handleAddNewSize = (newSize) => {
    if (newSize && !sizes.includes(newSize)) {
      addSize(newSize);
    }
  };

  const handleAddNewColor = (newColor) => {
    if (newColor && !colors.includes(newColor)) {
      addColor(newColor);
    }
  };

  // 新增控制庫存編輯模態框中自訂輸入框顯示的狀態
  const [showInventoryCustomColorInput, setShowInventoryCustomColorInput] =
    useState(false);
  const [showInventoryCustomSizeInput, setShowInventoryCustomSizeInput] =
    useState(false);

  // 新增庫存項目的狀態控制
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventoryEdit, setInventoryEdit] = useState({
    color: "",
    size: "",
    quantity: 0,
    isEditing: false,
    originalColor: "",
    originalSize: "",
  });

  // 打開新增庫存表單
  const handleAddInventoryModal = () => {
    setInventoryEdit({
      color: "",
      size: "",
      quantity: 0,
      isEditing: false,
      originalColor: "",
      originalSize: "",
    });
    setShowInventoryCustomColorInput(false);
    setShowInventoryCustomSizeInput(false);
    setNewColorInput("");
    setNewSizeInput("");
    setShowInventoryModal(true);
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

  // 刪除庫存項目
  const handleRemoveInventory = (color, size) => {
    // 創建新的 num 對象
    const newNum = { ...modalData.num };

    // 檢查是否有其他尺寸
    const hasOtherSizes = Object.keys(newNum[color]).length > 1;

    if (hasOtherSizes) {
      // 只刪除特定尺寸
      delete newNum[color][size];
    } else {
      // 如果這是該顏色的唯一尺寸，刪除整個顏色項
      delete newNum[color];
    }

    // 更新 modalData
    setModalData({
      ...modalData,
      num: newNum,
    });

    // 計算並更新總庫存數量
    const newTotal = calculateTotalStock(newNum);
    setTotalStockQuantity(newTotal);
  };

  // 保存庫存項目
  const handleSaveInventory = () => {
    const { color, size, quantity, isEditing, originalColor, originalSize } =
      inventoryEdit;

    // 基本驗證
    if (!color || !size || quantity <= 0) {
      toastAlert({
        icon: "error",
        title: "請填寫完整的庫存資訊",
      });
      return;
    }

    // 複製當前的 num 對象，確保它是一個對象
    const newNum = modalData.num ? { ...modalData.num } : {};

    // 如果是編輯模式，先刪除原來的記錄
    if (isEditing) {
      // 如果顏色或尺寸有變化，需要刪除原來的記錄
      if (originalColor !== color || originalSize !== size) {
        // 檢查原始顏色是否有其他尺寸
        if (
          newNum[originalColor] &&
          Object.keys(newNum[originalColor]).length > 1
        ) {
          // 只刪除特定尺寸
          delete newNum[originalColor][originalSize];
        } else {
          // 刪除整個顏色
          delete newNum[originalColor];
        }
      }
    }

    // 確保顏色對象存在
    if (!newNum[color]) {
      newNum[color] = {};
    }

    // 添加或更新尺寸的數量
    newNum[color][size] = parseInt(quantity, 10);

    // 更新 modalData
    setModalData({
      ...modalData,
      num: newNum,
    });

    // 關閉模態框
    setShowInventoryModal(false);
  };

  const [newColorInput, setNewColorInput] = useState("");
  const [newSizeInput, setNewSizeInput] = useState("");

  const [editingInventory, setEditingInventory] = useState({
    isEditing: false,
    color: "",
    size: "",
    quantity: 0,
    originalColor: "",
    originalSize: "",
  });

  // 修改編輯開始函數，增加原始顏色和尺寸的保存
  const handleInlineEditStart = (color, size, quantity) => {
    setEditingInventory({
      isEditing: true,
      color,
      size,
      quantity,
      originalColor: color, // 保存原始顏色
      originalSize: size, // 保存原始尺寸
    });
  };

  // 修改確認編輯函數，處理顏色或尺寸變更的情況
  const handleInlineEditConfirm = () => {
    if (editingInventory.isEditing) {
      const { color, size, quantity, originalColor, originalSize } =
        editingInventory;

      // 驗證數量和必填項
      if (!color || !size || quantity <= 0) {
        toastAlert({
          icon: "error",
          title: "請確保顏色、尺寸已填寫，且數量必須大於0",
        });
        return;
      }

      // 創建新的 num 對象
      const newNum = { ...modalData.num };

      // 檢查是否有更改顏色或尺寸
      if (originalColor !== color || originalSize !== size) {
        // 檢查原始顏色是否有其他尺寸
        if (
          newNum[originalColor] &&
          Object.keys(newNum[originalColor]).length > 1
        ) {
          // 只刪除特定尺寸
          delete newNum[originalColor][originalSize];
        } else {
          // 刪除整個顏色
          delete newNum[originalColor];
        }

        // 確保新顏色對象存在
        if (!newNum[color]) {
          newNum[color] = {};
        }
      }

      // 更新或新增數量
      newNum[color][size] = parseInt(quantity, 10);

      // 更新 modalData
      setModalData({
        ...modalData,
        num: newNum,
      });

      // 重置編輯狀態
      setEditingInventory({
        isEditing: false,
        color: "",
        size: "",
        quantity: 0,
        originalColor: "",
        originalSize: "",
      });
    }
  };

  // 修改處理顏色和尺寸變更的函數
  const handleEditingInventoryChange = (field, value) => {
    setEditingInventory({
      ...editingInventory,
      [field]: value,
    });
  };

  // 取消編輯
  const handleInlineEditCancel = () => {
    setEditingInventory({
      isEditing: false,
      color: "",
      size: "",
      quantity: 0,
    });
  };

  // 處理數量變更
  const handleQuantityChange = (e) => {
    const value = e.target.value;
    setEditingInventory({
      ...editingInventory,
      quantity: value,
    });
  };

  // 批量庫存管理功能
  const [showBatchStockModal, setShowBatchStockModal] = useState(false);
  const [batchStockData, setBatchStockData] = useState({
    selectedColors: [],
    selectedSizes: [],
    quantity: 1,
  });

  // 批量設置庫存的函數
  const handleBatchStockChange = (field, value) => {
    setBatchStockData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // 處理多選顏色變更
  const handleColorSelectionChange = (e) => {
    const options = e.target.options;
    const selectedValues = [];

    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value);
      }
    }

    setBatchStockData((prev) => ({
      ...prev,
      selectedColors: selectedValues,
    }));
  };

  // 處理多選尺寸變更
  const handleSizeSelectionChange = (e) => {
    const options = e.target.options;
    const selectedValues = [];

    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value);
      }
    }

    setBatchStockData((prev) => ({
      ...prev,
      selectedSizes: selectedValues,
    }));
  };

  // 批量保存庫存
  const handleSaveBatchStock = () => {
    const { selectedColors, selectedSizes, quantity } = batchStockData;

    // 驗證
    if (
      selectedColors.length === 0 ||
      selectedSizes.length === 0 ||
      quantity <= 0
    ) {
      toastAlert({
        icon: "error",
        title: "請選擇顏色、尺寸，並設定有效的數量",
      });
      return;
    }

    // 複製當前庫存
    const newNum = { ...(modalData.num || {}) };

    // 更新所有選定的顏色和尺寸組合
    selectedColors.forEach((color) => {
      if (!newNum[color]) {
        newNum[color] = {};
      }

      selectedSizes.forEach((size) => {
        newNum[color][size] = parseInt(quantity, 10);
      });
    });

    // 更新 modalData
    setModalData({
      ...modalData,
      num: newNum,
    });

    // 關閉模態框
    setShowBatchStockModal(false);

    // 提示成功
    toastAlert({
      icon: "success",
      title: "批量更新庫存成功",
    });
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
            <div className="modal-header border-bottom bg-light">
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

            <div className="modal-body p-4 bg-white">
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
                        className="form-control bg-white"
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
                      {modalData.imagesUrl &&
                        modalData.imagesUrl.length < 5 &&
                        (modalData.imagesUrl.length === 0 ||
                          (modalData.imagesUrl[
                            modalData.imagesUrl.length - 1
                          ] &&
                            modalData.imagesUrl[
                              modalData.imagesUrl.length - 1
                            ] !== "")) && (
                          <button
                            type="button"
                            onClick={handleAddImage}
                            className="btn btn-outline-primary btn-sm w-100"
                          >
                            新增圖片
                          </button>
                        )}
                      {modalData.imagesUrl &&
                        modalData.imagesUrl.length > 0 && (
                          <button
                            type="button"
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
                        className="form-control border bg-white"
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
                      className="form-control border bg-white"
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
                        className="form-control border bg-white"
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
                        className="form-control border bg-white"
                        placeholder="請輸入商品類別細項"
                      />
                    </div>
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
                      className="form-control border bg-white"
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
                        className="form-control border bg-white mb-2"
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
                        className="form-control border bg-white mb-2"
                        placeholder="請輸入售價"
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="design_style" className="form-label">
                      商品穿搭風格
                    </label>
                    <input
                      value={modalData?.content?.design_style || ""}
                      onChange={handleModalInputChange}
                      name="design_style"
                      id="design_style"
                      type="text"
                      className="form-control border bg-white"
                      placeholder="請輸入穿搭風格"
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="origin" className="form-label">
                      產地
                    </label>
                    <input
                      value={modalData?.content?.origin || ""}
                      onChange={handleModalInputChange}
                      name="origin"
                      id="origin"
                      type="text"
                      className="form-control border bg-white"
                      placeholder="請輸入產地"
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">
                      產品描述
                    </label>
                    <textarea
                      value={modalData.description || modalData.content?.design_introduction || ""}
                      onChange={handleModalInputChange}
                      name="description"
                      id="description"
                      className="form-control border bg-white mb-2"
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
                      className="form-control border bg-white mb-2"
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
                      className="form-control border bg-white mb-2"
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
                      className="form-control border bg-white mb-2"
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
                      className="form-control border bg-white mb-2"
                      rows={1}
                      placeholder="請輸入商品清洗方式"
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="status" className="form-label">
                      購買狀態
                    </label>
                    <select
                      value={modalData.status}
                      onChange={handleModalInputChange}
                      name="status"
                      id="status"
                      className="form-select border bg-white"
                    >
                      <option value="">請選擇購買狀態</option>
                      {status.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>

                    {/* 新增自訂購買狀態的按鈕和輸入框 */}
                    <div className="mt-2">
                      {!showCustomStatusInput ? (
                        <button
                          type="button"
                          className="btn btn-outline-dark btn-sm"
                          onClick={() => setShowCustomStatusInput(true)}
                        >
                          + 新增自訂狀態
                        </button>
                      ) : (
                        <div className="input-group">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="請輸入新狀態"
                            id="newStatusInput"
                            autoFocus
                          />
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => {
                              const input =
                                document.getElementById("newStatusInput");
                              if (input && input.value) {
                                handleAddNewStatus(input.value);
                                input.value = "";
                                setShowCustomStatusInput(false);
                              }
                            }}
                          >
                            確定
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-dark"
                            onClick={() => setShowCustomStatusInput(false)}
                          >
                            取消
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 商品庫存管理 */}
                  <div className="mb-4 mt-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="fw-bold border-bottom pb-2">
                        商品庫存管理
                      </h6>
                      <div className="badge bg-black text-white p-2 mb-2">
                        總庫存數量:{" "}
                        <span className="fs-6">{totalStockQuantity}</span>
                      </div>
                    </div>

                    {modalData.num && Object.keys(modalData.num).length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-bordered table-hover">
                          <thead className="table-light">
                            <tr>
                              <th>顏色</th>
                              <th>尺寸</th>
                              <th>數量</th>
                              <th>操作</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(modalData.num).map(
                              ([color, sizeData]) =>
                                Object.entries(sizeData).map(
                                  ([size, quantity]) => {
                                    const isEditing =
                                      editingInventory.isEditing &&
                                      editingInventory.originalColor ===
                                        color &&
                                      editingInventory.originalSize === size;

                                    return (
                                      <tr key={`${color}-${size}`}>
                                        <td>
                                          {isEditing ? (
                                            <select
                                              className="form-select form-select-sm"
                                              value={editingInventory.color}
                                              onChange={(e) =>
                                                handleEditingInventoryChange(
                                                  "color",
                                                  e.target.value
                                                )
                                              }
                                            >
                                              {colors.map((colorOption) => (
                                                <option
                                                  key={colorOption}
                                                  value={colorOption}
                                                >
                                                  {colorOption}
                                                </option>
                                              ))}
                                            </select>
                                          ) : (
                                            color
                                          )}
                                        </td>

                                        <td>
                                          {isEditing ? (
                                            <select
                                              className="form-select form-select-sm"
                                              value={editingInventory.size}
                                              onChange={(e) =>
                                                handleEditingInventoryChange(
                                                  "size",
                                                  e.target.value
                                                )
                                              }
                                            >
                                              {sizes.map((sizeOption) => (
                                                <option
                                                  key={sizeOption}
                                                  value={sizeOption}
                                                >
                                                  {sizeOption}
                                                </option>
                                              ))}
                                            </select>
                                          ) : (
                                            size
                                          )}
                                        </td>

                                        <td>
                                          {isEditing ? (
                                            <input
                                              type="number"
                                              className="form-control form-control-sm"
                                              value={editingInventory.quantity}
                                              onChange={handleQuantityChange}
                                              min="1"
                                              autoFocus
                                            />
                                          ) : (
                                            quantity
                                          )}
                                        </td>
                                        <td>
                                          <div className="btn-group btn-group-sm">
                                            {isEditing ? (
                                              // 編輯模式: 顯示確認按鈕
                                              <button
                                                type="button"
                                                className="btn btn-primary"
                                                onClick={
                                                  handleInlineEditConfirm
                                                }
                                              >
                                                確認
                                              </button>
                                            ) : (
                                              // 非編輯模式: 顯示編輯按鈕
                                              <button
                                                type="button"
                                                className="btn btn-primary"
                                                onClick={() =>
                                                  handleInlineEditStart(
                                                    color,
                                                    size,
                                                    quantity
                                                  )
                                                }
                                              >
                                                編輯
                                              </button>
                                            )}

                                            {isEditing ? (
                                              // 編輯模式: 顯示取消按鈕
                                              <button
                                                type="button"
                                                className="btn btn-outline-dark"
                                                onClick={handleInlineEditCancel}
                                              >
                                                取消
                                              </button>
                                            ) : (
                                              // 非編輯模式: 顯示刪除按鈕
                                              <button
                                                type="button"
                                                className="btn btn-outline-danger"
                                                onClick={() =>
                                                  handleRemoveInventory(
                                                    color,
                                                    size
                                                  )
                                                }
                                              >
                                                刪除
                                              </button>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  }
                                )
                            )}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="alert alert-warning">
                        <i className="bi bi-info-circle me-2"></i>
                        尚未設定庫存資料
                      </div>
                    )}

                    <div className="mt-2">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={handleAddInventoryModal}
                      >
                        <i className="bi bi-plus-circle me-1"></i>+ 新增庫存項目
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm ms-2"
                        onClick={() => setShowBatchStockModal(true)}
                      >
                        <i className="bi bi-grid me-1"></i> 批量設定庫存
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="mb-2 crow g-3">
                      <div className="col-3 mb-2">
                        新增顏色
                        <FaPlusCircle
                          onClick={() => setShowInventoryCustomColorInput(true)}
                          className="text-dark align-self-center ms-2"
                          style={{
                            fontSize: "20px",
                            cursor: "pointer",
                          }}
                        />
                      </div>
                      <div className="col-12 mt-2">
                        {/* 新增自訂顏色的輸入框 */}
                        {showInventoryCustomColorInput && (
                          <div className="input-group mb-2">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="請輸入新顏色"
                              value={newColorInput}
                              onChange={(e) => setNewColorInput(e.target.value)}
                              autoFocus
                            />
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => {
                                if (newColorInput.trim()) {
                                  handleAddNewColor(newColorInput);
                                  setInventoryEdit({
                                    ...inventoryEdit,
                                    color: newColorInput,
                                  });
                                  setNewColorInput("");
                                  setShowInventoryCustomColorInput(false);
                                }
                              }}
                            >
                              確定
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-dark"
                              onClick={() => {
                                setNewColorInput("");
                                setShowInventoryCustomColorInput(false);
                              }}
                            >
                              取消
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="mb-2 crow g-3">
                      <div className="col-3 mb-2">
                        新增尺寸
                        <FaPlusCircle
                          onClick={() => setShowInventoryCustomSizeInput(true)}
                          className="text-dark align-self-center ms-2"
                          style={{
                            fontSize: "20px",
                            cursor: "pointer",
                          }}
                        />
                      </div>
                      <div className="col-12 mt-2">
                        {/* 新增自訂尺寸的輸入框 */}
                        {showInventoryCustomSizeInput && (
                          <div className="input-group mb-2">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="請輸入新尺寸"
                              value={newSizeInput}
                              onChange={(e) => setNewSizeInput(e.target.value)}
                              autoFocus
                            />
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => {
                                if (newSizeInput.trim()) {
                                  handleAddNewSize(newSizeInput);
                                  setInventoryEdit({
                                    ...inventoryEdit,
                                    size: newSizeInput,
                                  });
                                  setNewSizeInput("");
                                  setShowInventoryCustomSizeInput(false);
                                }
                              }}
                            >
                              確定
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-dark"
                              onClick={() => {
                                setNewSizeInput("");
                                setShowInventoryCustomSizeInput(false);
                              }}
                            >
                              取消
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
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
                className="btn btn-dark"
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

      {/* 庫存編輯模態框 */}
      {/* <div
        className={`modal fade ${showInventoryModal ? "show" : ""}`}
        style={{
          display: showInventoryModal ? "block" : "none",
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
        tabIndex="-1"
        aria-labelledby="inventoryModalLabel"
        aria-hidden={!showInventoryModal}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content bg-white">
            <div className="modal-header bg-light">
              <h5 className="modal-title" id="inventoryModalLabel">
                {inventoryEdit.isEditing ? "編輯庫存項目" : "新增庫存項目"}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowInventoryModal(false)}
                aria-label="Close"
              ></button>
            </div>

            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="inventoryColor" className="form-label ">
                  顏色
                </label>
                <div className="d-flex mb-2">
                  <select
                    className="form-select bg-white me-2"
                    id="inventoryColor"
                    value={inventoryEdit.color}
                    onChange={(e) =>
                      setInventoryEdit({
                        ...inventoryEdit,
                        color: e.target.value,
                      })
                    }
                  >
                    <option value="">請選擇顏色</option>
                    {colors.map((color) => (
                      <option key={color} value={color}>
                        {color}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="inventorySize" className="form-label">
                  尺寸
                </label>
                <div className="d-flex mb-2">
                  <select
                    className="form-select bg-white me-2"
                    id="inventorySize"
                    value={inventoryEdit.size}
                    onChange={(e) =>
                      setInventoryEdit({
                        ...inventoryEdit,
                        size: e.target.value,
                      })
                    }
                  >
                    <option value="">請選擇尺寸</option>
                    {sizes.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="inventoryQuantity" className="form-label">
                  數量
                </label>
                <input
                  type="number"
                  className="form-control bg-white"
                  name="inventoryQuantity"
                  id="inventoryQuantity"
                  value={inventoryEdit.quantity}
                  onChange={(e) => {
                    const value = e.target.value;
                    setInventoryEdit({
                      ...inventoryEdit,
                      quantity: value === "" ? "" : value,
                    });
                  }}
                  min="0"
                />
              </div>
            </div>

            <div className="modal-footer bg-light">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowInventoryModal(false)}
              >
                取消
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveInventory}
              >
                確認
              </button>
            </div>
          </div>
        </div>
      </div> */}
      <div
        className={`modal fade ${showInventoryModal ? "show" : ""}`}
        style={{
          display: showInventoryModal ? "block" : "none",
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
        tabIndex="-1"
        aria-labelledby="inventoryModalLabel"
        aria-hidden={!showInventoryModal}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content bg-white">
            <div className="modal-header bg-light">
              <h5 className="modal-title" id="inventoryModalLabel">
                {inventoryEdit.isEditing ? "編輯庫存項目" : "新增庫存項目"}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowInventoryModal(false)}
                aria-label="Close"
              ></button>
            </div>

            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="inventoryColor" className="form-label ">
                  顏色
                </label>
                <div className="d-flex mb-2">
                  <select
                    className="form-select bg-white me-2"
                    id="inventoryColor"
                    value={inventoryEdit.color}
                    onChange={(e) =>
                      setInventoryEdit({
                        ...inventoryEdit,
                        color: e.target.value,
                      })
                    }
                  >
                    <option value="">請選擇顏色</option>
                    {colors.map((color) => (
                      <option key={color} value={color}>
                        {color}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="inventorySize" className="form-label">
                  尺寸
                </label>
                <div className="d-flex mb-2">
                  <select
                    className="form-select bg-white me-2"
                    id="inventorySize"
                    value={inventoryEdit.size}
                    onChange={(e) =>
                      setInventoryEdit({
                        ...inventoryEdit,
                        size: e.target.value,
                      })
                    }
                  >
                    <option value="">請選擇尺寸</option>
                    {sizes.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="inventoryQuantity" className="form-label">
                  數量
                </label>
                <input
                  type="number"
                  className="form-control bg-white"
                  name="inventoryQuantity"
                  id="inventoryQuantity"
                  value={inventoryEdit.quantity}
                  onChange={(e) => {
                    const value = e.target.value;
                    setInventoryEdit({
                      ...inventoryEdit,
                      quantity: value === "" ? "" : value,
                    });
                  }}
                  min="0"
                />
              </div>
            </div>

            <div className="modal-footer bg-light">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowInventoryModal(false)}
              >
                取消
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveInventory}
              >
                確認
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 批量庫存設定模態框 */}
      <div
        className={`modal fade ${showBatchStockModal ? "show" : ""}`}
        style={{
          display: showBatchStockModal ? "block" : "none",
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
        tabIndex="-1"
        aria-hidden={!showBatchStockModal}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content bg-white">
            <div className="modal-header bg-light">
              <h5 className="modal-title">批量設定庫存</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowBatchStockModal(false)}
                aria-label="Close"
              ></button>
            </div>

            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">選擇顏色 (可多選)</label>
                <select
                  className="form-select bg-white"
                  multiple
                  size={Math.min(5, colors.length)}
                  value={batchStockData.selectedColors}
                  onChange={handleColorSelectionChange}
                >
                  {colors.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
                <small className="text-muted">按住 Ctrl 鍵可多選</small>
              </div>

              <div className="mb-3">
                <label className="form-label">選擇尺寸 (可多選)</label>
                <select
                  className="form-select bg-white"
                  multiple
                  size={Math.min(5, sizes.length)}
                  value={batchStockData.selectedSizes}
                  onChange={handleSizeSelectionChange}
                >
                  {sizes.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                <small className="text-muted">按住 Ctrl 鍵可多選</small>
              </div>

              <div className="mb-3">
                <label className="form-label">設定數量</label>
                <input
                  type="number"
                  className="form-control bg-white"
                  value={batchStockData.quantity}
                  onChange={(e) =>
                    handleBatchStockChange(
                      "quantity",
                      parseInt(e.target.value, 10) || 0
                    )
                  }
                  min="0"
                />
              </div>
            </div>

            <div className="modal-footer bg-light">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowBatchStockModal(false)}
              >
                取消
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveBatchStock}
              >
                確認設定
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