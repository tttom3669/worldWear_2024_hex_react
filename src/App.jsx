import { Outlet } from 'react-router-dom';
import FrontFooter from './components/front/FrontFooter';
function App() {
  return (
    <div className="site">
      <Outlet />
      <FrontFooter />
    </div>
  );
}

export default App;
