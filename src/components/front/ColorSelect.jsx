import PropTypes from 'prop-types';

const ColorSelect = ({ colors, selectedColor, onChange, disabled = false }) => {
  // 如果沒有顏色選項，返回 null
  if (!colors || colors.length === 0) {
    return null;
  }

  return (
    <select
      className="form-select form-select-sm mb-2"
      value={selectedColor || ''}
      onChange={(e) => onChange(e.target.value)}
      style={{ backgroundColor: 'white' }}
      disabled={disabled}
    >
      <option value="" style={{ backgroundColor: 'white' }}>
        選擇顏色
      </option>
      {colors.map((color) => (
        <option key={color} value={color} style={{ backgroundColor: 'white' }}>
          {color}
        </option>
      ))}
    </select>
  );
};

ColorSelect.propTypes = {
  colors: PropTypes.array.isRequired,
  selectedColor: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default ColorSelect;
