import axios from 'axios';
import AddressForm from '../../../components/front/AddressForm';
import FormTitle from '../../../components/front/FormTitle';
import UserAside from '../../../components/front/UserAside';
import useImgUrl from '../../../hooks/useImgUrl';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { useEffect, useMemo, useState } from 'react';
import ScreenLoading from '../../../components/front/ScreenLoading';
import useSwal from '../../../hooks/useSwal';
const { VITE_API_PATH: API_PATH } = import.meta.env;
// import Swal from 'sweetalert2';

export default function UserInfo() {
  const getImgUrl = useImgUrl();
  const userData = useSelector((state) => state.authSlice.user);
  const token = useSelector((state) => state.authSlice.token);
  const [ordersData, setOrdersData] = useState([]);
  const [defaultUserData, setDefaultUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { modalAlert } = useSwal();

  const getUser = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(
        `${API_PATH}/users/${userData.id}/?_embed=orders`,
        {
          headers: {
            authorization: token,
          },
        }
      );
      const { county, address, region, birthday, email, name, tel, orders } =
        res.data;
      setDefaultUserData({
        county,
        address,
        region,
        birthday,
        email,
        name,
        tel,
      });
      console.log(res.data);
      setOrdersData(orders);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data) => {
    const result = await modalAlert({
      title: '是否修改會員資料?',
      imageUrl: getImgUrl('/images/shared/ic_warning.png'),
      showCancel: true,
    });

    try {
      if (result.isConfirmed) {
        setIsLoading(true);
        await axios.patch(`${API_PATH}/users/${userData.id}`, data, {
          headers: {
            authorization: token,
          },
        });
        await modalAlert({
          title: '修改會員資料成功',
          imageUrl: getImgUrl('/images/shared/ic_Check.png'),
          showCancel: false,
        });
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    const result = await await modalAlert({
      title: '是否修改密碼?',
      imageUrl: getImgUrl('/images/shared/ic_warning.png'),
      showCancel: true,
    });

    try {
      if (result.isConfirmed) {
        setIsLoading(true);
        const res = await axios.post(`${API_PATH}/login`, {
          email: userData.email,
          password: data.oldPassword,
        });
        if (res.status === 200) {
          await axios.patch(
            `${API_PATH}/users/${userData.id}`,
            {
              password: data.newPassword,
            },
            {
              headers: {
                authorization: token,
              },
            }
          );
          await modalAlert({
            title: '修改密碼成功',
            imageUrl: getImgUrl('/images/shared/ic_Check.png'),
            showCancel: false,
          });
          resetPassword({
            oldPassword: '',
            newPassword: '',
            confirmNewPassword: '',
          });
        }
      }
    } catch (error) {
      console.log(error);
      await modalAlert({
        icon: 'error',
        title: '舊密碼錯誤',
        text: '請檢查舊密碼是否正確',
        showCancel: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const orderCount = useMemo(() => {
    return ordersData.reduce((acc, order) => {
      return acc + order.final_total;
    }, 0);
  }, [ordersData]);

  // 會員資料修改表單的 useForm
  const {
    register: registerUserInfo,
    handleSubmit: handleSubmitUserInfo,
    formState: { errors: errorsUserInfo },
    reset: resetUserInfo,
  } = useForm({ mode: 'onChange', defaultValues: defaultUserData });

  // 密碼修改表單的 useForm
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    watch: watchPassword,
    formState: { errors: errorsPassword },
    reset: resetPassword,
  } = useForm({ mode: 'onChange' });

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (defaultUserData) {
      resetUserInfo(defaultUserData);
    }
  }, [defaultUserData]);

  return (
    <>
      <main className="userInfo">
        <div className="pt-3 pb-3 pt-md-10 pb-md-25">
          <div className="container px-0 px-sm-3">
            <div className="row mx-0 mx-sm-n3">
              <div className="d-none col-lg-2 d-lg-block">
                <UserAside />
              </div>
              <div className="col-lg-7 px-0 px-sm-3 ">
                <h1 className="fs-h5 fw-bold mb-3 px-3 px-sm-0 mb-md-5">
                  會員資料維護
                </h1>
                <div className="bg-white border-opacity-0 border-opacity-sm-100 border border-nature-95 py-8 px-5 mb-6">
                  <div className="d-flex align-items-center mb-5">
                    <div className="d-flex align-items-center bg-black gap-1 text-white px-2 py-1">
                      <img
                        src={getImgUrl('/images/user/user-check.png')}
                        alt="user-check"
                      />
                      會員等級
                    </div>
                    <div className="bg-primary-70  px-2 py-1">一般會員</div>
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <div>年度累積消費金額：</div>
                    <div className="fw-medium">
                      NT.{orderCount.toLocaleString('zh-TW')}元
                    </div>
                  </div>
                </div>
                <div className="mb-6">
                  <FormTitle
                    title="會員資料修改"
                    titleBgColor={'bg-nature-80'}
                    borderColor={'border-nature-80'}
                  />
                  <form
                    className="d-flex flex-column gap-5 bg-white py-8 px-5 border border-nature-95"
                    onSubmit={handleSubmitUserInfo(onSubmit)}
                  >
                    <div className="d-flex align-items-center gap-6">
                      <label htmlFor="name" className="form-label">
                        會員姓名
                      </label>
                      <div className="userInfo__col">
                        <input
                          type="text"
                          className={`form-control ${
                            errorsUserInfo.name && 'is-invalid'
                          }`}
                          id="name"
                          placeholder="請輸入姓名"
                          {...registerUserInfo('name', {
                            required: { value: true, message: '請輸入姓名' },
                          })}
                        />
                        <p className="invalid-feedback">
                          {errorsUserInfo?.name?.message}
                        </p>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-6">
                      <label htmlFor="tel" className="form-label">
                        會員電話
                      </label>
                      <div className="userInfo__col">
                        <input
                          type="tel"
                          className={`form-control ${
                            errorsUserInfo.tel && 'is-invalid'
                          }`}
                          id="tel"
                          placeholder="請輸入電話號碼"
                          {...registerUserInfo('tel', {
                            required: {
                              value: true,
                              message: '請輸入電話號碼',
                            },
                            pattern: {
                              value: /^(0[2-8]\d{7}|09\d{8})$/,
                              message: '電話格式不正確',
                            },
                            minLength: {
                              value: 8,
                              message: '電話不少於 8 碼',
                            },
                          })}
                        />
                        <p className="invalid-feedback">
                          {errorsUserInfo?.tel?.message}
                        </p>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-6">
                      <label htmlFor="email" className="form-label">
                        電子郵件
                      </label>
                      <div className="userInfo__col">
                        <input
                          type="email"
                          className={`form-control ${
                            errorsUserInfo.email && 'is-invalid'
                          }`}
                          id="email"
                          readOnly
                          disabled
                          placeholder="請輸入電子郵件"
                          {...registerUserInfo('email', {
                            required: {
                              value: true,
                              message: '請輸入電子郵件',
                            },
                            pattern: {
                              value:
                                /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$/,
                              message: 'Email 格式不正確',
                            },
                          })}
                        />
                        <p className="invalid-feedback">
                          {errorsUserInfo?.email?.message}
                        </p>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-6">
                      <label htmlFor="birthday" className="form-label">
                        生日
                      </label>
                      <div className="userInfo__col">
                        <input
                          type="date"
                          className={`form-control ${
                            errorsUserInfo.birthday && 'is-invalid'
                          }`}
                          id="birthday"
                          placeholder="請輸入生日"
                          {...registerUserInfo('birthday', {
                            required: {
                              value: true,
                              message: '請輸入生日',
                            },
                          })}
                        />
                        <p className="invalid-feedback">
                          {errorsUserInfo?.birthday?.message}
                        </p>
                      </div>
                    </div>
                    <AddressForm
                      register={registerUserInfo}
                      errors={errorsUserInfo}
                      defaultRegion={defaultUserData?.region}
                      defaultCounty={defaultUserData?.county}
                    />
                    <button type="submit" className="btn btn-lg btn-primary">
                      確認修改會員資料
                    </button>
                  </form>
                </div>
                <div className="bg-white">
                  <FormTitle
                    title="密碼修改"
                    titleBgColor={'bg-nature-80'}
                    borderColor={'border-nature-80'}
                  />
                  <form
                    className="d-flex flex-column gap-5 bg-white py-8 px-5 border border-nature-95"
                    onSubmit={handleSubmitPassword(onPasswordSubmit)}
                  >
                    {/* 添加隱藏的使用者名稱欄位 */}
                    <div style={{ display: 'none' }}>
                      <label htmlFor="username">使用者名稱</label>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        autoComplete="username"
                        className="form-control"
                      />
                    </div>
                    <div className="d-flex  align-items-center gap-6">
                      <label htmlFor="oldPassword" className="form-label">
                        輸入舊密碼
                      </label>
                      <div className="userInfo__col">
                        <input
                          type="password"
                          className={`form-control ${
                            errorsPassword.oldPassword && 'is-invalid'
                          }`}
                          id="oldPassword"
                          placeholder="請輸入舊密碼"
                          autoComplete="current-password"
                          {...registerPassword('oldPassword', {
                            required: {
                              value: true,
                              message: '請輸入舊密碼',
                            },
                          })}
                        />
                        <p className="invalid-feedback">
                          {errorsPassword?.oldPassword?.message}
                        </p>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-6">
                      <label htmlFor="newPassword" className="form-label">
                        輸入新密碼
                      </label>
                      <div className="userInfo__col">
                        <input
                          type="password"
                          className={`form-control ${
                            errorsPassword.newPassword && 'is-invalid'
                          }`}
                          id="newPassword"
                          placeholder="請輸入新密碼"
                          autoComplete="new-password"
                          {...registerPassword('newPassword', {
                            required: {
                              value: true,
                              message: '請輸入新密碼',
                            },
                          })}
                        />
                        <p className="invalid-feedback">
                          {errorsPassword?.newPassword?.message}
                        </p>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-6">
                      <label
                        htmlFor="confirmNewPassword"
                        className="form-label"
                      >
                        確認新密碼
                      </label>
                      <div className="userInfo__col">
                        <input
                          type="password"
                          className={`form-control ${
                            errorsPassword.confirmNewPassword && 'is-invalid'
                          }`}
                          id="confirmNewPassword"
                          placeholder="請再次輸入新密碼"
                          autoComplete="new-password"
                          {...registerPassword('confirmNewPassword', {
                            required: {
                              value: true,
                              message: '請再次輸入新密碼',
                            },
                            validate: (value) =>
                              value === watchPassword('newPassword') ||
                              '新密碼與確認密碼不相符',
                          })}
                        />
                        <p className="invalid-feedback">
                          {errorsPassword?.confirmNewPassword?.message}
                        </p>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="btn btn-lg btn-secondary"
                      disabled={
                        !watchPassword('oldPassword') ||
                        !watchPassword('newPassword')
                      }
                    >
                      確認修改會員資料
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <ScreenLoading isLoading={isLoading} />
    </>
  );
}
