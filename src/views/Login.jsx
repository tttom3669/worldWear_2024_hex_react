import axios from 'axios';

const { VITE_API_PATH: API_PATH } = import.meta.env;

export default function Login() {
  const login = async () => {
    const res = await axios.post(`${API_PATH}/login`, {
      email: 'worldwear@gmail.com',
      password: 'worldwear',
    });
    console.log(res);
    const { accessToken, user } = res.data;
    document.cookie = `worldWearToken=${accessToken};`;
    document.cookie = `worldWearUserId=${user.id}`;
    console.log(accessToken, user.id);
  };
  return (
    <>
      <h1>登入頁面</h1>
      <button type="button" onClick={login}>
        登入
      </button>
    </>
  );
}
