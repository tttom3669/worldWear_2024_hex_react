import Swal from 'sweetalert2';

const MyComponent = () => {
  const showCustomAlert = () => {
    Swal.fire({
      title: '自訂模板範例',
      html: `
        color: red;">
          儲存 "Untitled 1" 的變更？
          儲存
          取消
          不儲存直接關閉
        
      `,
      showConfirmButton: false, // 隱藏 SweetAlert2 的預設確認按鈕
      showCancelButton: false, // 隱藏 SweetAlert2 的預設取消按鈕
      showDenyButton: false, // 隱藏 SweetAlert2 的預設拒絕按鈕
    });
  };

  return (
    <div>
      <button onClick={showCustomAlert}>顯示自訂警示框</button>
    </div>
  );
};

export default MyComponent;