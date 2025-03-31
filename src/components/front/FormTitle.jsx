import PropTypes from 'prop-types';

function FormTitle({ title, className, borderColor, titleBgColor }) {
  return (
    <div className={className}>
      <h2 className={`fw-bold fs-base border-bottom border-2 ${borderColor}`}>
        <span className={`d-inline-block px-3 py-2 ${ titleBgColor }`}>{title}</span>
      </h2>
    </div>
  );
}

FormTitle.propTypes = {
  title: PropTypes.string,
  className: PropTypes.string,
  borderColor: PropTypes.string,
  titleBgColor: PropTypes.string,
};

export default FormTitle;
