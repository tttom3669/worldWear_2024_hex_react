import { memo, useEffect, useState } from 'react';
import taiwanAddressData from '../../assets/zipcode.json'; // 載入 JSON 檔案
import PropTypes from 'prop-types';
const AddressForm = ({ register, errors, defaultRegion, defaultCounty }) => {
  // 取得所有縣市
  const counties = taiwanAddressData.cities.map((item) => item.name);
  const [regions, setRegions] = useState([]);
  const [selectedCounty, setSelectedCounty] = useState('台北市');
  const [selectedRegion, setSelectedRegion] = useState({ name: '', code: '' });
  const [selectedCode, setSelectedCode] = useState('');

  const handleCountyChange = (e) => {
    const county = e.target.value;
    setSelectedCounty(county);
  };
  const handleRegionChange = (region) => {
    const filterRegion = regions.find((item) => item.name === region);
    setSelectedRegion(filterRegion); // 重置區域
  };

  useEffect(() => {
    setRegions(taiwanAddressData.cities[0].region);
    setSelectedCode(taiwanAddressData.cities[0].region[0].code);
  }, []);

  useEffect(() => {
    if (!defaultCounty || !defaultRegion) return;

    const initRegions = taiwanAddressData.cities.find(
      (county) => county.name === defaultCounty
    ).region;
    const initRegion = initRegions.find(
      (region) => region.name === defaultRegion
    );

    setRegions(initRegions);
    setSelectedCode(initRegion.code);
  }, [defaultCounty, defaultRegion]);

  // 縣市更換時，更新區域
  useEffect(() => {
    const filterRegions = taiwanAddressData.cities.find(
      (item) => item.name === selectedCounty
    ).region;
    setRegions(filterRegions);
    setSelectedRegion({
      name: filterRegions[0].name,
      code: filterRegions[0].code,
    });
  }, [selectedCounty]);

  // 區域更換時，更新區域編碼
  useEffect(() => {
    setSelectedCode(selectedRegion.code); // 重置區域編碼
  }, [selectedRegion]);

  return (
    <>
      <div className="d-flex align-items-start gap-6">
        <label htmlFor="exampleFormControlInput1" className="form-label">
          宅配地址
        </label>
        <div className="d-flex flex-column gap-2">
          <div className="userInfo__col d-flex gap-3">
            <select
              className="form-select"
              aria-label="addressCounty"
              id="county"
              {...register('county')}
              onChange={(e) => handleCountyChange(e)}
            >
              {counties.map((country, index) => (
                <option key={index} value={country}>
                  {country}
                </option>
              ))}
            </select>
            <select
              className="form-select"
              aria-label="addressRegion"
              id="region"
              {...register('region')}
              onChange={(e) => handleRegionChange(e.target.value)}
            >
              {regions.map((region) => (
                <option key={region.code} value={region.name}>
                  {region.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              className="form-control"
              id="addressCodeFormControl"
              placeholder="addressCode"
              readOnly
              disabled
              value={selectedCode}
            />
          </div>
          <div className="userInfo__col">
            <input
              type="text"
              className={`form-control ${errors.address && 'is-invalid'}`}
              id="address"
              placeholder="請輸入地址"
              {...register('address', {
                required: { value: true, message: '請輸入地址' },
              })}
            />
            <p className="invalid-feedback">{errors?.address?.message}</p>
          </div>
        </div>
      </div>
    </>
  );
};

AddressForm.propTypes = {
  register: PropTypes.func.isRequired,
  errors: PropTypes.object.isRequired,
  defaultRegion: PropTypes.string,
  defaultCounty: PropTypes.string,
  defaultAddress: PropTypes.string,
};

export default memo(AddressForm);
