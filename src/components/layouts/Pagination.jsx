import { useState, useMemo } from "react";
import { Row } from "react-bootstrap";

const Pagination = ({ data, RenderComponent, pageLimit, dataLimit }) => {
  const pages = Math.ceil(data.length / dataLimit);
  const [currentPage, setCurrentPage] = useState(1);

  const goToNextPage = () => {
    setCurrentPage((page) => (page < pages ? page + 1 : page));
  };

  const goToPreviousPage = () => {
    setCurrentPage((page) => (page > 1 ? page - 1 : page));
  };

  const changePage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= pages) {
      setCurrentPage(pageNumber);
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
          <RenderComponent key={index} data={item} />
        ))}
      </Row>

      {pages > 1 && (
        <div className="d-flex justify-content-center mt-4 pagination-container">
          <button
            onClick={goToPreviousPage}
            className="btn btn-outline-primary mx-2"
            disabled={currentPage === 1}
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
            >
              {item}
            </button>
          ))}

          <button
            onClick={goToNextPage}
            className="btn btn-outline-primary mx-2"
            disabled={currentPage === pages}
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