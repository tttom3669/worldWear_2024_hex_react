import PropTypes from 'prop-types';
import useImgUrl from '../../hooks/useImgUrl';
function CartFlow({ className, step }) {
  const getImgUrl = useImgUrl();
  return (
    <>
      <div className={`container ${className}`}>
        <div className="row justify-content-center">
          <div className="col-md-10 col-lg-8">
            <div className='px-2 pb-5 px-md-0 pb-md-0'>
              <div className="d-flex justify-content-between mb-3">
                <div className="text-primary-60 fw-bold fs-sm tracking-none">
                  購物明細
                </div>
                <div className="text-primary-60 fw-bold fs-sm tracking-none">
                  結帳資訊
                </div>
                <div className="text-primary-60 fw-bold fs-sm tracking-none">
                  完成訂單
                </div>
              </div>
              <div className="l-cart-flow">
                {[...Array(3).keys()].map((i) => (
                  <div
                    key={i}
                    className={`l-cart-flow__process ${
                      step >= i + 1 ? 'active' : ''
                    }`}
                  >
                    {i === 2 ? (
                      <svg width="24" height="24">
                        <use href={getImgUrl('/icons/check.svg#check')}></use>
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

CartFlow.propTypes = {
  className: PropTypes.string,
  step: PropTypes.number,
};

export default CartFlow;
