import { useEffect, useMemo, useState } from 'react';
import { Row } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import useImgUrl from '../../hooks/useImgUrl';

const Pagination = ({
  data,
  RenderComponent,
  pageLimit,
  dataLimit,
  currentPage,
  setCurrentPage,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const pages = Math.ceil(data.length / dataLimit);
  const getImgUrl = useImgUrl();

  // 新增：使用本地狀態追蹤當前頁碼
  const [localCurrentPage, setLocalCurrentPage] = useState(currentPage);

  // 當 props 中的 currentPage 改變時，同步本地狀態
  useEffect(() => {
    setLocalCurrentPage(currentPage);
  }, [currentPage]);

  // 當 URL 參數變化時更新頁碼
  useEffect(() => {
    const pageParam = searchParams.get('page');
    if (pageParam) {
      const pageNumber = parseInt(pageParam, 10);
      if (
        !isNaN(pageNumber) &&
        pageNumber >= 1 &&
        pageNumber <= pages &&
        pageNumber !== localCurrentPage
      ) {
        setLocalCurrentPage(pageNumber);
        // 只有當值真的不同時才觸發父元件更新
        if (pageNumber !== currentPage) {
          setCurrentPage(pageNumber);
        }
      }
    } else if (localCurrentPage > 1) {
      // 如果沒有頁碼參數但 localCurrentPage 不是第一頁，更新 URL
      updateURLPage(localCurrentPage);
    }
  }, [searchParams, pages, currentPage, localCurrentPage]);

  // 更新 URL 中的頁碼
  const updateURLPage = (page) => {
    searchParams.set('page', page);
    setSearchParams(searchParams);
  };

  const goToNextPage = () => {
    if (localCurrentPage < pages) {
      const nextPage = localCurrentPage + 1;
      // 立即更新本地狀態以響應 UI
      setLocalCurrentPage(nextPage);
      // 更新父元件狀態 (可能是 Redux)
      setCurrentPage(nextPage);
      // 更新 URL
      updateURLPage(nextPage);
    }
  };

  const goToPreviousPage = () => {
    if (localCurrentPage > 1) {
      const prevPage = localCurrentPage - 1;
      // 立即更新本地狀態以響應 UI
      setLocalCurrentPage(prevPage);
      // 更新父元件狀態 (可能是 Redux)
      setCurrentPage(prevPage);
      // 更新 URL
      updateURLPage(prevPage);
    }
  };

  const changePage = (pageNumber) => {
    if (
      pageNumber >= 1 &&
      pageNumber <= pages &&
      pageNumber !== localCurrentPage
    ) {
      // 立即更新本地狀態以響應 UI
      setLocalCurrentPage(pageNumber);
      // 更新父元件狀態 (可能是 Redux)
      setCurrentPage(pageNumber);
      // 更新 URL
      updateURLPage(pageNumber);
    }
  };

  const paginatedData = useMemo(() => {
    const startIndex = (localCurrentPage - 1) * dataLimit;
    return data.slice(startIndex, startIndex + dataLimit);
  }, [localCurrentPage, data, dataLimit]);

  const paginationGroup = useMemo(() => {
    let start = Math.floor((localCurrentPage - 1) / pageLimit) * pageLimit + 1;
    let end = Math.min(start + pageLimit - 1, pages);
    return Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
  }, [localCurrentPage, pageLimit, pages]);

  return (
    <div>
      <Row>
        {paginatedData.map((item, index) => (
          <RenderComponent key={item.id || index} data={item} />
        ))}
      </Row>

      {pages > 1 && (
        <div className="d-flex justify-content-center mt-4 pagination-container">
          <button
            onClick={goToPreviousPage}
            className="btn btn-outline-primary mx-2"
            disabled={localCurrentPage === 1}
            aria-label="前一頁"
          >
            <svg width="10" height="19">
              <use href={getImgUrl('/icons/prev.svg#prev')}></use>
            </svg>
          </button>

          {paginationGroup.map((item) => (
            <button
              key={item}
              onClick={() => changePage(item)}
              className={`btn mx-1 ${
                localCurrentPage === item
                  ? 'btn-primary'
                  : 'btn-outline-primary'
              }`}
              aria-current={localCurrentPage === item ? 'page' : undefined}
              aria-label={`第 ${item} 頁`}
            >
              {item}
            </button>
          ))}

          <button
            onClick={goToNextPage}
            className="btn btn-outline-primary mx-2"
            disabled={localCurrentPage === pages}
            aria-label="下一頁"
          >
            <svg width="10" height="19">
              <use href={getImgUrl('/icons/next.svg#next')}></use>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default Pagination;
