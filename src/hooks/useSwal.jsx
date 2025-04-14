import { useCallback, useMemo } from 'react';
import Swal from 'sweetalert2';

const useSwal = () => {
  const Toast = useMemo(() => {
    return Swal.mixin({
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
  }, []);
  const swalWithBootstrapButtons = useMemo(() => {
    return Swal.mixin({
      customClass: {
        container: 'cusswal-modal',
        confirmButton: 'btn btn-primary',
        cancelButton: 'btn btn-secondary',
      },
      buttonsStyling: false,
    });
  }, []);
  const toastAlert = useCallback(
    ({ icon, title }) => {
      Toast.fire({
        icon,
        title,
      });
    },
    [Toast]
  );
  const modalAlert = useCallback(
    ({ title, text, icon, imageUrl, showCancel }) => {
      return swalWithBootstrapButtons.fire({
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
    [swalWithBootstrapButtons]
  );
  return {
    toastAlert,
    modalAlert,
  };
};

export default useSwal;
