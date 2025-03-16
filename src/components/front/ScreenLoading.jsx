import PropTypes from 'prop-types';

const ScreenLoading = ({ isLoading }) => {
  return (
    <div className={`c-loading ${isLoading ? 'active' : ''}`}>
      <div className="spinner-border text-primary-60" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
};

ScreenLoading.propTypes = {
  isLoading: PropTypes.bool,
};

export default ScreenLoading;
