import { Outlet } from 'react-router-dom';
import FrontFooter from './components/front/FrontFooter';
function App() {
  return (
    <>
      <Outlet />
      <FrontFooter />
    </>
  );
}

export default App;
