import { Outlet } from 'react-router-dom';
import FrontHeader from '../../components/front/FrontHeader';

export default function FrontUserLayout() {
  return (
    <>
      <FrontHeader defaultType={'light'} />
      <Outlet />
    </>
  );
}
