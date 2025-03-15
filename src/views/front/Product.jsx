import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from "react-redux";
import axios from 'axios';
import useSwal from '../../hooks/useSwal';

import FrontHeader from '../../components/front/FrontHeader';
import useImgUrl from '../../hooks/useImgUrl';
const { VITE_API_PATH: API_PATH } = import.meta.env;

export default function Product() {
  const getImgUrl = useImgUrl();
  const { toastAlert } = useSwal();
  const { id: productId } = useParams();
  const user = useSelector(state => state.authSlice.user);
  const [product, setProduct] = useState({})
  const [isPostCartLoding, setIsPostCartLoding] = useState(false)
  const [isPostFavoritesLoding, setIsPostFavoritesLoding] = useState(false)
  const [cart, setCart] = useState({
    qty: 1,
    color: "",
    size: "",
    productId: ""
  })

  const getProduct = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_PATH}/products/${productId}`)
      console.log(data)
      setProduct(data)
      setCart(prevCart => ({
        ...prevCart,
        productId: productId
      }))
    } catch (error) {
      console.log(error)
    }
  }, [productId])

  const handleColorSelect = (selectedColor) => {
    setCart((prevCart) => ({
        ...prevCart,
        color: selectedColor,
        qty: 1
    }));
  };

  const handleSizeSelect = (selectedSize) => {
    setCart((prevCart) => ({
        ...prevCart,
        size: selectedSize,
        qty: 1
    }));
  };

  const handleQtySelect = (change) => {
    if (!cart.color || !cart.size) {
        alert("請先選擇顏色和尺寸");
        return;
    }

    const maxQty = product.num?.[cart.color]?.[cart.size] || 1;
    const newQty = Math.max(1, Math.min(cart.qty + change, maxQty));

    setCart((prevCart) => ({
        ...prevCart,
        qty: newQty
    }));
  };

  const postCarts = async () => {
    try { 
      setIsPostCartLoding(true)
      if (!cart.color || !cart.size) {
        toastAlert({ icon: 'error', title: '請先選取商品顏色和尺寸' })
        setIsPostCartLoding(false)
        return
      }
      const cartData = {
        userId: user.id,
        ...cart
      }
      await axios.post(`${API_PATH}/carts`, cartData)
      toastAlert({ icon: 'success', title: '已將商品加入購物車' });
      setIsPostCartLoding(false)
    } catch (error) {
      console.log(error)
    }
  }

  const postFavorites = async () => {
    try { 
      setIsPostFavoritesLoding(true)
      if (!cart.color || !cart.size) {
        toastAlert({ icon: 'error', title: '請先選取商品顏色和尺寸' })
        setIsPostFavoritesLoding(false)
        return
      }
      const cartData = {
        userId: user.id,
        ...cart
      }
      await axios.post(`${API_PATH}/favorites`, cartData)
      toastAlert({ icon: 'success', title: '已將商品加入收藏' })
      setIsPostFavoritesLoding(false)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    getProduct()
  }, [getProduct])

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('有token:', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [])

  return (
    <>
      <FrontHeader defaultType={'light'} />
      <main className="mb-20 product container">
        <div className="row justify-content-center">
          {/* 左側區塊：商品圖片區 */}
          <div className="col-md-5">
            <img src={product.imageUrl} className="img-fluid mb-6" alt="商品圖片"/>
            {
              product.imagesUrl &&
              product.imagesUrl.map((url, index) => (
                url ? <img key={index} src={url} className="img-fluid mb-6" alt="商品圖片"/> : null
              ))
            }
          </div>
    
          {/* 右側區塊：商品資訊與購物功能 */}
          <div className="col-md-4">
            <h1 className="mb-3">{product.title}</h1>
            <p className="mb-3 fs-h6">${product.price} <s className="origin-price">${product.origin_price}</s></p>
    
            <div className="mb-1">
              <span className="fs-base">顏色：</span>
              <span id="selected-color" className="fs-base">{cart.color}</span>
            </div>

            <div className="mb-3 color-btn">
              { 
                product.color &&
                product.color.map((color, index) => (
                  <button
                    key={index}
                    onClick={() => handleColorSelect(color)}
                    className={`btn btn-outline-primary btn-sm fs-base me-2 ${cart.color === color ? "active" : ""}`}
                    data-color={color}
                  >
                    {color}
                  </button>
                ))
              }
            </div>
    
            <div className="mb-2">
              <span className="fs-base">尺寸：</span>
              <span id="selected-size" className="fs-base">{cart.size}</span>
            </div>

            <div className="mb-3 btn-size">
              {
                product.size &&
                product.size.map((size, index) => (
                  <button
                    key={index}
                    onClick={() => handleSizeSelect(size)}
                    className={`btn btn-outline-primary btn-circle me-2 ${cart.size === size ? "active" : ""}`}
                    data-size={size}
                  >
                    {size}
                  </button>
                ))
              }
            </div>
    
            <div className="mb-1">
              <label htmlFor="quantity" className="form-label">數量：</label>
              <span id="quantity-display">{cart.qty}</span>
            </div>
            
            <div className="d-flex flex-row mb-3">
              <button
                onClick={() => handleQtySelect(-1)}
                className="btn btn-outline-primary btn-count btn-count-left"
                disabled={!cart.color || !cart.size}
              >
                <svg width="24" height="24">
                  <use href={getImgUrl('/images/product/iconminus.svg#minus')}></use>
                </svg>
              </button>
              <input type="number" className="input" id="quantity" value={cart.qty} min="1" readOnly/>
              <button
                onClick={() => handleQtySelect(1)}
                className="btn btn-outline-primary btn-count btn-count-right"
                disabled={!cart.color || !cart.size}
              >
                <svg width="24" height="24">
                  <use href={getImgUrl('/images/product/plus.svg#plus')}></use>
                </svg>
              </button>
            </div>
    
            <button
              onClick={postCarts}
              className="d-flex justify-content-center align-items-center mb-3 p-4 fs-base fw-bold btn btn-warning w-100"
              disabled={isPostCartLoding}
            >
              <img className="product-icon me-2" src={getImgUrl('/images/product/icon-cart.png')} alt="icon-cart"/>
              加入購物車
            </button>
             <button
                onClick={postFavorites}
                id="favorite-button"
                className="d-flex justify-content-center align-items-center mb-3 p-4 fs-base fw-bold btn btn-outline-primary w-100"
                disabled={isPostFavoritesLoding}
              >
                  <img id="favorite-icon" className="product-icon me-2" src={getImgUrl('/images/product/icon-heart-outline.png')} alt="icon-heart-outline"/>
                  加入喜愛收藏
              </button>
            <div className="mb-10 px-2 py-1 fs-sm tag">
              商品適用優惠：新會員優惠10%off
            </div>
    
            <div className="product-content">
              <ul className="nav nav-tabs fs-base fw-bold product-content__button-groupz">
                <li className="nav-item product-content__btn">
                  <button className="nav-link active" id="nav-info-tab" data-bs-toggle="tab" data-bs-target="#nav-info" type="button" role="tab" aria-controls="info" aria-selected="true">商品資訊</button>
                </li>
                <li className="nav-item product-content__btn">
                  <button className="nav-link" id="nav-wash-tab" data-bs-toggle="tab" data-bs-target="#nav-wash" type="button" role="tab" aria-controls="wash" aria-selected="true">洗滌方式</button>
                </li> 
                <li className="nav-item product-content__btn">
                  <button className="nav-link" id="nav-size-tab" data-bs-toggle="tab" data-bs-target="#nav-size" type="button" role="tab" aria-controls="size" aria-selected="true">產品尺寸</button>
                </li>
              </ul>
              <div id="nab-tabContent" className="tab-content">
                <div className="tab-pane fade show active p-6 product-content__detail" id="nav-info" role="tabpanel" aria-labelledby="nav-info-tab">
                  <p className="mb-3 fs-base fw-normal">{product.content?.design_style}
                  </p>
                  <p className="mb-3 fs-base fw-normal">{product.content?.design_Introduction}</p>
                  <p className="mb-3 fs-base fw-normal">{product.content?.design_introduction}</p>
                  <p className="mb-3 fs-base fw-normal">產地: {product.content?.origin}</p>
                </div>
                <div className="tab-pane fade p-6 product-content__detail" id="nav-wash" role="tabpanel" aria-labelledby="nav-wash-tab">
                  {product.clean && Object.values(product.clean).map((method, index) => (
                    <p key={index} className="mb-2 fs-base fw-normal">{method}</p>
                  ))}
                </div>
                <div className="tab-pane fade p-6 product-content__detail" id="nav-size" role="tabpanel" aria-labelledby="nav-size-tab">
                  <img className="mb-3 product-content__detail-img" src={getImgUrl('/images/product/product-size1.png')} alt="product-size"/>
                  <img className="product-content__detail-img" src={getImgUrl('/images/product/product-size2.png')} alt="product-size"/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}