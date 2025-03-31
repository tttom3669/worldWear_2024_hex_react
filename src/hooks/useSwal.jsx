import Swal from 'sweetalert2';

const useSwal = () => {
  const Toast = Swal.mixin({
    toast: true,
    position: window.innerWidth <= 576 ? 'top' : 'top-end',
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
  });
  const swalWithBootstrapButtons = Swal.mixin({
    customClass: {
      container: 'cusswal-modal',
      confirmButton: 'btn btn-primary',
      cancelButton: 'btn btn-secondary',
    },
    buttonsStyling: false,
  });
  return {
    toastAlert({ icon, title }) {
      Toast.fire({
        icon,
        title,
      });
    },
    modalAlert({ title, text, icon, imageUrl, showCancel }) {
     return  swalWithBootstrapButtons.fire({
        title,
        imageUrl,
        icon,
        text,
        showCancelButton: showCancel,
        confirmButtonText: '確認!',
        cancelButtonText: '取消',
        reverseButtons: true,
      });
    },
  };
};

export default useSwal;
