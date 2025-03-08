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
  return {
    toastAlert({ icon, title }) {
      Toast.fire({
        icon,
        title,
      });
    },
  };
};

export default useSwal;
