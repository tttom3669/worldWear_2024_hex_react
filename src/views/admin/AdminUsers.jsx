import { useSelector } from 'react-redux';

export default function AdminUsers() {
  const userData = useSelector((state) => state.authSlice.user);
  console.log(userData);

  return (
    <>
      <div className="container">
        <div className="py-10">
          <h1 className="fs-h4">所有會員</h1>
        </div>
      </div>
    </>
  );
}
