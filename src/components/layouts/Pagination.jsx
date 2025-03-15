import { useEffect, useMemo } from "react";
import { Row } from "react-bootstrap";
import { useSearchParams } from "react-router-dom";

const Pagination = ({ data, RenderComponent, pageLimit, dataLimit, currentPage, setCurrentPage }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const pages = Math.ceil(data.length / dataLimit);

  // 在元件初始化時，從 URL 查詢參數讀取頁碼
  useEffect(() => {
    const pageParam = searchParams.get("page");
    if (pageParam) {
      const pageNumber = parseInt(pageParam, 10);
      if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= pages && pageNumber !== currentPage) {
        setCurrentPage(pageNumber);
      }
    } else if (currentPage > 1) {
      // 如果沒有頁碼參數但 currentPage 不是第一頁，更新 URL
      updateURLPage(currentPage);
    }
  }, []);

  // 更新 URL 中的頁碼
  const updateURLPage = (page) => {
    searchParams.set("page", page);
    setSearchParams(searchParams);
  };

  const goToNextPage = () => {
    if (currentPage < pages) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      updateURLPage(nextPage);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      updateURLPage(prevPage);
    }
  };

  const changePage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= pages && pageNumber !== currentPage) {
      setCurrentPage(pageNumber);
      updateURLPage(pageNumber);
    }
  };

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * dataLimit;
    return data.slice(startIndex, startIndex + dataLimit);
  }, [currentPage, data, dataLimit]);

  const paginationGroup = useMemo(() => {
    let start = Math.floor((currentPage - 1) / pageLimit) * pageLimit + 1;
    let end = Math.min(start + pageLimit - 1, pages);
    return Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
  }, [currentPage, pageLimit, pages]);

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
            disabled={currentPage === 1}
            aria-label="前一頁"
          >
            <svg width="10" height="19">
              <use href="/icons/prev.svg#prev"></use>
            </svg>
          </button>

          {paginationGroup.map((item) => (
            <button
              key={item}
              onClick={() => changePage(item)}
              className={`btn mx-1 ${
                currentPage === item ? "btn-primary" : "btn-outline-primary"
              }`}
              aria-current={currentPage === item ? "page" : undefined}
              aria-label={`第 ${item} 頁`}
            >
              {item}
            </button>
          ))}

          <button
            onClick={goToNextPage}
            className="btn btn-outline-primary mx-2"
            disabled={currentPage === pages}
            aria-label="下一頁"
          >
            <svg width="10" height="19">
              <use href="/icons/next.svg#next"></use>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default Pagination;