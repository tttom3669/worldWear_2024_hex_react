import { useSelector } from 'react-redux';
import { countData } from '../../slice/testSlice';
import { useDispatch } from 'react-redux';
import { addCount } from '../../slice/testSlice';

function CounterReducer() {
  const count = useSelector(countData);
  return <div>RTK: {count}</div>;
}

function CounterBtn() {
  const dispatch = useDispatch();
  const addCountByClick = () => {
    dispatch(addCount());
  };
  return <button onClick={() => addCountByClick()}>RTK:點我加一</button>;
}

export default function Home() {
  return (
    <>
      <CounterReducer />
      <CounterBtn />
      <h1> 這是首頁</h1>
      <button type="button" className="btn btn-primary">
        Primary
      </button>
      <button type="button" className="btn btn-secondary">
        Secondary
      </button>
      <button type="button" className="btn btn-success">
        Success
      </button>
      <button type="button" className="btn btn-danger">
        Danger
      </button>
      <button type="button" className="btn btn-warning">
        Warning
      </button>
      <button type="button" className="btn btn-info">
        Info
      </button>
      <button type="button" className="btn btn-light">
        Light
      </button>
      <button type="button" className="btn btn-dark">
        Dark
      </button>

      <button type="button" className="btn btn-link">
        Link
      </button>
      <hr />
      <button
        type="button"
        className="btn btn-primary mt-1.5"
        data-bs-toggle="modal"
        data-bs-target="#exampleModal"
      >
        Launch demo modal
      </button>

      <div
        className="modal fade"
        id="exampleModal"
        tabIndex="-1"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="exampleModalLabel">
                Modal title
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">...</div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Close
              </button>
              <button type="button" className="btn btn-primary">
                Save changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
