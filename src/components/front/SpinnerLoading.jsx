export default function SpinnerLoading() {
  return (
    <div className="d-flex justify-content-center align-items-center py-10">
      <div className="spinner-border text-primary-60" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}
