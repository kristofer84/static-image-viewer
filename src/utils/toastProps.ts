import type { ToastProps } from 'vue-toast-notification';

export const toastProps = () => {
  if (mobile()) {
    return { position: 'bottom', duration: 4000 } as ToastProps;
  }

  return { position: 'top-right', duration: 4000 } as ToastProps;
};

export const mobile = () => window.innerHeight > window.innerWidth && window.innerWidth <= 500;
