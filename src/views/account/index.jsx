import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
export default function AccountIndex() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/account/login');
  }, [navigate]);
  return <></>;
}
