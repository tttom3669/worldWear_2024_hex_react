import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminHome() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/admin/products');
  }, [navigate]);
  return <>後台首頁</>;
}
