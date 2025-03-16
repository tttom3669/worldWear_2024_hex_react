import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import FrontHeader from '../../components/front/FrontHeader';
import ProductCard from '../../components/front/ProductCard';
import axios from 'axios';
import { useState } from 'react';
const { VITE_API_PATH: API_PATH } = import.meta.env;

export default function Search() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('s');
  const [searchProducts, setSearchProducts] = useState([]);

  const getSearchProduct = async (keyword) => {
    const res = await axios.get(`${API_PATH}/products?title_like=${keyword}`);
    setSearchProducts(res.data);
  };

  useEffect(() => {
    getSearchProduct(searchQuery);
  }, [searchQuery]);

  return (
    <>
      <title>{`${searchQuery} - WorldWear`}</title>
      <FrontHeader defaultType={'light'} />
      <main>
        <div className="container">
          <div className="py-10 py-md-25">
            <h1 className="fs-h4 fs-md-h3 fw-bold text-center mb-10">
              搜尋結果： {searchQuery}
            </h1>
            {searchProducts.length ? (
              <div className="row">
                {searchProducts.map((product) => (
                  <ProductCard data={product} key={product.id} />
                ))}
              </div>
            ) : (
              <div className="d-flex flex-column justify-content-center align-items-center py-10">
                <h2 className="fs-h6 fs-md-h5 fw-medium text-center mb-6">
                  未找尋到任何結果
                </h2>
                <Link to="/" className="btn btn-lg btn-primary">
                  返回首頁
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
