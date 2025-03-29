import { Link } from 'react-router-dom';
import useImgUrl from '../../hooks/useImgUrl';
import PropTypes from 'prop-types';

function AdminPagination({ paginationData, apiPath }) {
  const getImgUrl = useImgUrl();
  return (
    <>
      <div className="d-flex justify-content-center mt-4 pagination-container mt-auto">
        <Link
          to={`${apiPath}?page=${paginationData.currentPage - 1}`}
          className={`btn btn-outline-primary mx-2 ${
            paginationData.currentPage == 1 ? 'disabled' : ''
          }`}
          aria-label="前一頁"
        >
          <svg width="10" height="19">
            <use href={getImgUrl('/icons/prev.svg#prev')}></use>
          </svg>
        </Link>
        {paginationData.totalPage > 0 &&
          Array.from(
            { length: paginationData.totalPage },
            (_, index) => index + 1
          ).map((item) => (
            <Link
              key={item}
              to={`${apiPath}?page=${item}`}
              className={`btn mx-1 
                  ${
                    paginationData.currentPage == item
                      ? 'btn-primary'
                      : 'btn-outline-primary'
                  }`}
              aria-label={`第 ${item} 頁`}
            >
              {item}
            </Link>
          ))}

        <Link
          to={`${apiPath}s?page=${paginationData.currentPage + 1}`}
          className={`btn btn-outline-primary mx-2 ${
            paginationData.currentPage == paginationData.totalPage
              ? 'disabled'
              : ''
          }`}
          aria-label="下一頁"
        >
          <svg width="10" height="19">
            <use href={getImgUrl('/icons/next.svg#next')}></use>
          </svg>
        </Link>
      </div>
    </>
  );
}

AdminPagination.propTypes = {
  paginationData: PropTypes.object.isRequired,
  apiPath: PropTypes.string.isRequired,
};

export default AdminPagination;
