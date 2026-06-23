import toast from 'react-hot-toast';
import { CustomToast } from '@/components/ui/Toast';

function showToast(description: string, type: 'success' | 'error' | 'warning' | 'info', title?: string) {
  return toast.custom(
    (t) => <CustomToast t={t} type={type} title={title} description={description} />,
    { duration: 3500, style: { padding: 0 } }
  );
}

export function showSuccess(description: string, title?: string) {
  return showToast(description, 'success', title);
}

export function showError(description: string, title?: string) {
  return showToast(description, 'error', title);
}

export function showWarning(description: string, title?: string) {
  return showToast(description, 'warning', title);
}

export function showInfo(description: string, title?: string) {
  return showToast(description, 'info', title);
}

export { showToast };
