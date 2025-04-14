import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { Modal } from "bootstrap";
import axios from "axios";
import useSwal from "../../hooks/useSwal";
import PropTypes from "prop-types";

const { VITE_API_PATH: API_PATH } = import.meta.env;

const DeleteProductModal = ({
  tempProduct,
  getProducts,
  isOpen,
  setIsOpen,
}) => {
  const token = useSelector((state) => state.authSlice.token);
  const { toastAlert } = useSwal();
  // modal 實體
  const delProductModalRef = useRef(null);
  useEffect(() => {
    new Modal(delProductModalRef.current, {
      backdrop: false,
    });
  }, []);

  // 監聽 isOpen 值狀態，如果為 true 則打開 modal
  useEffect(() => {
    if (isOpen) {
      const modalInstance = Modal.getInstance(delProductModalRef.current);
      modalInstance.show();
    }
  }, [isOpen]);

  // 關閉 modal
  const handleCloseDelProductModal = () => {
    const modalInstance = Modal.getInstance(delProductModalRef.current);
    modalInstance.hide();
    setIsOpen(false);
  };

  // 刪除商品方法
  const deleteProduct = async () => {
    try {
      await axios.delete(`${API_PATH}/admin/products/${tempProduct.id}`, {
        headers: {
          authorization: token,
        },
      });
      toastAlert({
        icon: "success",
        title: "刪除產品成功",
      });
    } catch (error) {
      // 檢查是否有中文錯誤訊息
      let errorMessage = "刪除產品失敗";

      // 檢查 response 中是否有中文錯誤訊息
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        // 如果沒有中文錯誤訊息，則使用錯誤原因
        errorMessage = `${errorMessage}：${error.message}`;
      }

      toastAlert({
        icon: "error",
        title: errorMessage,
      });
    }
  };
  // 控制與執行刪除商品
  const handelDeleteProduct = async () => {
    try {
      await deleteProduct();
      getProducts();
      handleCloseDelProductModal();
    } catch (error) {
      throw new Error(`刪除商品操作失敗: ${error.message}`);
    }
  };

  return (
    <>
      <div
        ref={delProductModalRef}
        className="modal fade"
        id="delProductModal"
        tabIndex="-1"
        aria-hidden="true"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5">刪除產品</h1>
              <button
                onClick={handleCloseDelProductModal}
                type="button"
                className="btn-close"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              你是否要刪除
              <span className="text-danger fw-bold">{tempProduct.title}</span>
            </div>
            <div className="modal-footer">
              <button
                onClick={handleCloseDelProductModal}
                type="button"
                className="btn btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handelDeleteProduct}
                type="button"
                className="btn btn-danger"
              >
                刪除
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

DeleteProductModal.propTypes = {
  tempProduct: PropTypes.object.isRequired,
  getProducts: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  setIsOpen: PropTypes.func.isRequired,
};

export default DeleteProductModal;
