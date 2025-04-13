import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { checkEmailExists, clearError } from '../slice/authSlice';
import { useForm } from 'react-hook-form';
import FrontHeader from '../components/front/FrontHeader';
import FrontFooter from '../components/front/FrontFooter';
import useSwal from '../hooks/useSwal';
import cookieUtils from '../components/tools/cookieUtils';
import PropTypes from 'prop-types';

// 常量定義
const TABS = {
  LOGIN: 'login',
  REGISTER: 'register',
};

const initialLoginData = {
  email: '',
  password: '',
  // email: "worldwear@gmail.com",
  // password: "worldwear",
  rememberMe: false,
};

const initialRegisterData = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const initialForgotPasswordData = {
  email: '',
};

export default function Login() {
  const [activeTab, setActiveTab] = useState(TABS.LOGIN);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { toastAlert } = useSwal();

  useEffect(() => {
    const state = location.state;
    if (state && state.activeTab) {
      setActiveTab(state.activeTab === 'login' ? TABS.LOGIN : TABS.REGISTER);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);

  // Redux 狀態
  const emailCheckStatus = useSelector(
    (state) => state.authSlice.emailCheckStatus
  );
  const emailExists = useSelector((state) => state.authSlice.emailExists);
  const checkedEmail = useSelector((state) => state.authSlice.checkedEmail);
  const [submitError, setSubmitError] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Refs
  const isLoginAttemptRef = useRef(false);
  const isRegisterAttemptRef = useRef(false);
  const isResetPasswordAttemptRef = useRef(false);
  const emailCheckTimeoutRef = useRef(null);

  // 表單設置
  const loginForm = useForm({
    defaultValues: initialLoginData,
  });

  const registerForm = useForm({
    defaultValues: initialRegisterData,
    mode: 'onChange',
  });

  const forgotPasswordForm = useForm({
    defaultValues: initialForgotPasswordData,
  });

  // 檢查用戶是否已登入
  useEffect(() => {
    if (cookieUtils.isUserLoggedIn()) {
      navigate('/');
    }
  }, [navigate]);

  // 監聽註冊表單中的郵件欄位
  useEffect(() => {
    const subscription = registerForm.watch((values, { name }) => {
      if (name === 'email') {
        if (emailCheckTimeoutRef.current) {
          clearTimeout(emailCheckTimeoutRef.current);
        }

        const email = values.email;
        if (email && registerForm.getFieldState('email').valid) {
          emailCheckTimeoutRef.current = setTimeout(() => {
            dispatch(checkEmailExists(email));
          }, 300);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
      }
    };
  }, [registerForm, dispatch, checkedEmail]);

  // 郵件檢查效果
  useEffect(() => {
    if (emailExists && checkedEmail === registerForm.getValues().email) {
      registerForm.setError('email', {
        type: 'manual',
        message: '此郵件已被註冊，請使用其他郵件或直接登入',
      });
    }
  }, [emailExists, checkedEmail, registerForm]);

  // 登入處理
  const handleLogin = useCallback(
    async (data) => {
      try {
        setSubmitError(null);
        setIsLoading(true);
        isLoginAttemptRef.current = true;

        // 使用 cookieUtils 處理登入
        const loginResult = await cookieUtils.handleLogin(
          data.email,
          data.password,
          data.rememberMe
        );

        if (loginResult.success) {
          toastAlert({ icon: 'success', title: '登入成功' });
          navigate('/');
        }
      } catch (error) {
        console.error('登入錯誤:', error);

        setSubmitError(error.message);
        toastAlert({
          icon: 'error',
          title: '登入失敗',
          text: error.message,
        });

        isLoginAttemptRef.current = false;
      } finally {
        setIsLoading(false);
      }
    },
    [navigate, toastAlert]
  );

  // 註冊處理
  const handleRegister = useCallback(
    async (data) => {
      try {
        // 再檢查一次郵件是否已存在
        if (emailExists && registerForm.getValues().email === checkedEmail) {
          registerForm.setError('email', {
            type: 'manual',
            message: '此郵件已被註冊，請使用其他郵件或直接登入',
          });
          return;
        }

        setSubmitError(null);
        setIsLoading(true);
        isRegisterAttemptRef.current = true;

        // 使用 cookieUtils 處理註冊
        const registerResult = await cookieUtils.handleRegister({
          username: data.username,
          email: data.email,
          password: data.password,
        });

        if (registerResult.success) {
          toastAlert({
            icon: 'success',
            title: '註冊成功',
            text: '請用您的帳號密碼登入',
          });

          // 自動填入登入表單的電子郵件
          loginForm.setValue('email', data.email);
          loginForm.setValue('password', '');

          // 清空註冊表單
          registerForm.reset(initialRegisterData);

          isRegisterAttemptRef.current = false;
          setActiveTab(TABS.LOGIN);
        }
      } catch (error) {
        console.error('註冊錯誤:', error);

        setSubmitError(error.message);
        toastAlert({
          icon: 'error',
          title: '註冊失敗',
          text: error.message,
        });

        isRegisterAttemptRef.current = false;
      } finally {
        setIsLoading(false);
      }
    },
    [
      toastAlert,
      registerForm,
      emailExists,
      checkedEmail,
      loginForm,
      initialRegisterData,
    ]
  );

  // 忘記密碼處理
  const handleForgotPassword = useCallback(async () => {
    try {
      setSubmitError(null);
      setIsLoading(true);
      isResetPasswordAttemptRef.current = true;

      // TODO: 實現忘記密碼的具體邏輯
      // 可能需要在 cookieUtils 中添加相應的方法
      toastAlert({
        icon: 'success',
        title: '重設密碼郵件已發送',
        text: '請檢查您的電子郵件信箱，並按照指示重設密碼',
      });

      // 重置表單並返回登入視圖
      forgotPasswordForm.reset(initialForgotPasswordData);
      setShowForgotPassword(false);
    } catch (error) {
      const errorMsg =
        typeof error === 'string' ? error : '重設密碼請求失敗，請稍後再試';

      setSubmitError(errorMsg);
      toastAlert({
        icon: 'error',
        title: '重設密碼請求失敗',
        text: errorMsg,
      });
    } finally {
      setIsLoading(false);
      isResetPasswordAttemptRef.current = false;
    }
  }, [toastAlert, forgotPasswordForm, initialForgotPasswordData]);

  // 頁籤切換處理
  const handleTabChange = useCallback(
    (tab) => {
      if (tab !== activeTab) {
        setActiveTab(tab);
        setSubmitError(null);

        // 重置各種嘗試標記
        isLoginAttemptRef.current = false;
        isRegisterAttemptRef.current = false;
        isResetPasswordAttemptRef.current = false;

        // 關閉忘記密碼視圖
        setShowForgotPassword(false);

        // 重置表單
        loginForm.reset(initialLoginData);
        registerForm.reset(initialRegisterData);
        forgotPasswordForm.reset(initialForgotPasswordData);

        // 清除全局錯誤
        dispatch(clearError());
      }
    },
    [
      activeTab,
      dispatch,
      loginForm,
      registerForm,
      forgotPasswordForm,
      initialLoginData,
      initialRegisterData,
      initialForgotPasswordData,
    ]
  );

  // 切換忘記密碼視圖
  const toggleForgotPassword = useCallback(() => {
    setShowForgotPassword((prev) => !prev);
    setSubmitError(null);
    forgotPasswordForm.reset(initialForgotPasswordData);
  }, [forgotPasswordForm, initialForgotPasswordData]);

  // 清除錯誤的副作用
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch, activeTab]);

  return (
    <>
      <div className="site">
        <FrontHeader defaultType={'light'} />
        <main className="bg-nature-99">
          <div className="container py-5 mt-10 mb-10">
            <div className="row justify-content-center">
              <div className="col-md-6 login_col">
                <div className="card Login__card">
                  <div className="card-header p-0">
                    <ul className="nav nav-tabs w-100">
                      {Object.entries(TABS).map(([key, tab]) => (
                        <li key={key} className="nav-item w-50">
                          <button
                            className={`nav-link w-100 ${
                              activeTab === tab ? 'active' : 'inactive'
                            }`}
                            onClick={() => handleTabChange(tab)}
                          >
                            {tab === TABS.LOGIN ? '會員登入' : '加入會員'}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="card-body Login__card-body">
                    <div className="tab-content bg-white">
                      {/* 登入表單 */}
                      {activeTab === TABS.LOGIN && !showForgotPassword && (
                        <LoginForm
                          form={loginForm}
                          submitError={submitError}
                          isLoading={isLoading}
                          onSubmit={handleLogin}
                          onForgotPassword={toggleForgotPassword}
                        />
                      )}

                      {/* 忘記密碼表單 */}
                      {activeTab === TABS.LOGIN && showForgotPassword && (
                        <ForgotPasswordForm
                          form={forgotPasswordForm}
                          submitError={submitError}
                          isLoading={isLoading}
                          onSubmit={handleForgotPassword}
                          onBack={toggleForgotPassword}
                        />
                      )}

                      {/* 註冊表單 */}
                      {activeTab === TABS.REGISTER && (
                        <RegisterForm
                          form={registerForm}
                          submitError={submitError}
                          isLoading={isLoading}
                          isEmailChecking={emailCheckStatus === 'loading'}
                          onSubmit={handleRegister}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <FrontFooter />
      </div>
    </>
  );
}

// 登入表單子組件保持不變
const LoginForm = memo(
  ({ form, submitError, isLoading, onSubmit, onForgotPassword }) => {
    const {
      register,
      handleSubmit,
      formState: { errors },
    } = form;

    return (
      <div className="tab-pane fade show active">
        <form onSubmit={handleSubmit(onSubmit)}>
          {submitError && (
            <div className="alert alert-danger">{submitError}</div>
          )}
          <div className="mb-3">
            <label htmlFor="email" className="form-label mt-4">
              電子郵件
            </label>
            <input
              id="email"
              className={`form-control bg-white ${
                errors.email ? 'is-invalid' : ''
              }`}
              placeholder="請輸入您的電子郵件"
              {...register('email', {
                required: '請輸入電子郵件',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: '請輸入有效的電子郵件格式',
                },
              })}
            />
            {errors.email && (
              <div className="invalid-feedback">{errors.email.message}</div>
            )}
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label mt-4">
              密碼
            </label>
            <input
              id="password"
              type="password"
              className={`form-control bg-white ${
                errors.password ? 'is-invalid' : ''
              }`}
              placeholder="請輸入您的密碼"
              {...register('password', {
                required: '請輸入密碼',
              })}
            />
            {errors.password && (
              <div className="invalid-feedback">{errors.password.message}</div>
            )}
          </div>
          <div className="mb-3 d-flex justify-content-between mt-8">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="rememberMe"
                {...register('rememberMe')}
              />
              <label className="form-check-label" htmlFor="rememberMe">
                記住我
              </label>
            </div>
            <div className="forgot-password">
              <button
                type="button"
                className="btn btn-sm text-muted border border-muted rounded btn-forgot-password"
                onClick={onForgotPassword}
              >
                忘記密碼
              </button>
            </div>
          </div>
          <div className="d-grid mt-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? '登入中...' : '登入'}
            </button>
          </div>
        </form>
      </div>
    );
  }
);

LoginForm.displayName = 'LoginForm';
LoginForm.propTypes = {
  form: PropTypes.object.isRequired,
  submitError: PropTypes.string,
  isLoading: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onForgotPassword: PropTypes.func.isRequired,
};

// 忘記密碼表單子組件
const ForgotPasswordForm = memo(
  ({ form, submitError, isLoading, onSubmit, onBack }) => {
    const {
      register,
      handleSubmit,
      formState: { errors },
    } = form;

    return (
      <div className="tab-pane fade show active">
        <div className="d-flex align-items-center mb-4">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary me-2"
            onClick={onBack}
          >
            <i className="bi bi-arrow-left"></i> 返回
          </button>
          <h5 className="mb-0">忘記密碼</h5>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          {submitError && (
            <div className="alert alert-danger">{submitError}</div>
          )}
          <div className="mb-4">
            <p className="text-muted">
              請輸入您的電子郵件，我們將發送密碼重設連結給您。
            </p>
          </div>
          <div className="mb-3">
            <label htmlFor="forgotEmail" className="form-label">
              電子郵件
            </label>
            <input
              id="forgotEmail"
              className={`form-control bg-white ${
                errors.email ? 'is-invalid' : ''
              }`}
              placeholder="請輸入您註冊時使用的電子郵件"
              {...register('email', {
                required: '請輸入電子郵件',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: '請輸入有效的電子郵件格式',
                },
              })}
            />
            {errors.email && (
              <div className="invalid-feedback">{errors.email.message}</div>
            )}
          </div>
          <div className="d-grid mt-4">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? '發送中...' : '發送重設密碼連結'}
            </button>
          </div>
        </form>
      </div>
    );
  }
);

ForgotPasswordForm.displayName = 'ForgotPasswordForm';
ForgotPasswordForm.propTypes = {
  form: PropTypes.object.isRequired,
  submitError: PropTypes.string,
  isLoading: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
};

// 註冊表單子組件 - 更新以使用 React Hook Form
const RegisterForm = memo(
  ({ form, submitError, isLoading, isEmailChecking, onSubmit }) => {
    const {
      register,
      handleSubmit,
      formState: { errors },
      watch,
    } = form;
    const password = watch('password');

    return (
      <div className="tab-pane fade show active">
        <form onSubmit={handleSubmit(onSubmit)}>
          {submitError && (
            <div className="alert alert-danger">{submitError}</div>
          )}
          <div className="mb-3">
            <label htmlFor="username" className="form-label">
              姓名
            </label>
            <input
              type="text"
              className={`form-control bg-white ${
                errors.username ? 'is-invalid' : ''
              }`}
              id="username"
              placeholder="請輸入您的姓名"
              {...register('username', {
                required: '請輸入姓名',
              })}
            />
            {errors.username && (
              <div className="invalid-feedback">{errors.username.message}</div>
            )}
          </div>
          <div className="mb-3">
            <label htmlFor="registerEmail" className="form-label">
              電子郵件
            </label>
            <div className="input-group">
              <input
                type="email"
                className={`form-control bg-white ${
                  errors.email ? 'is-invalid' : ''
                }`}
                id="registerEmail"
                placeholder="請輸入您的電子郵件"
                {...register('email', {
                  required: '請輸入電子郵件',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: '請輸入有效的電子郵件格式',
                  },
                })}
              />
              {isEmailChecking && (
                <div className="input-group-append">
                  <span className="input-group-text">
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    ></span>
                  </span>
                </div>
              )}
            </div>
            {errors.email && (
              <div className="invalid-feedback d-block">
                {errors.email.message}
              </div>
            )}
          </div>
          <div className="mb-3">
            <label htmlFor="registerPassword" className="form-label">
              密碼
            </label>
            <input
              type="password"
              className={`form-control bg-white ${
                errors.password ? 'is-invalid' : ''
              }`}
              id="registerPassword"
              placeholder="請設定您的密碼"
              {...register('password', {
                required: '請輸入密碼',
                minLength: {
                  value: 8,
                  message: '密碼長度至少需要8個字元',
                },
              })}
            />
            {errors.password && (
              <div className="invalid-feedback">{errors.password.message}</div>
            )}
          </div>
          <div className="mb-3">
            <label htmlFor="confirmPassword" className="form-label">
              確認密碼
            </label>
            <input
              type="password"
              className={`form-control bg-white ${
                errors.confirmPassword ? 'is-invalid' : ''
              }`}
              id="confirmPassword"
              placeholder="請再次輸入密碼"
              {...register('confirmPassword', {
                required: '請確認密碼',
                validate: (value) => value === password || '密碼不一致',
              })}
            />
            {errors.confirmPassword && (
              <div className="invalid-feedback">
                {errors.confirmPassword.message}
              </div>
            )}
          </div>
          <div className="mb-3 text-center">
            <small>
              當您使用 WorldWear 購物，代表您同意
              <a href="#" className="text-decoration-none text-secondary">
                &nbsp;服務條款&nbsp;
              </a>
              與
              <a href="#" className="text-decoration-none text-secondary">
                &nbsp;隱私政策&nbsp;
              </a>
            </small>
          </div>
          <div className="d-grid">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={
                isLoading ||
                isEmailChecking ||
                errors.email?.message?.includes('已被註冊')
              }
            >
              {isLoading ? '註冊中...' : '註冊'}
            </button>
          </div>
        </form>
      </div>
    );
  }
);

RegisterForm.displayName = 'RegisterForm';
RegisterForm.propTypes = {
  form: PropTypes.object.isRequired,
  submitError: PropTypes.string,
  isLoading: PropTypes.bool.isRequired,
  isEmailChecking: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
