import toast from 'react-hot-toast';
import { Check, X, AlertCircle, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToastProps {
  t: any;
  message: string;
  icon: React.ReactNode;
  iconBg: string;
  borderColor: string;
}

const ToastContainer: React.FC<ToastProps> = ({ t, message, icon, iconBg, borderColor }) => (
  <div
    className={cn(
      "flex items-center gap-3 p-4 bg-white rounded-xl shadow-xl border-2",
      "transform transition-all duration-300 min-w-[300px] max-w-md",
      borderColor,
      t.visible ? "animate-slide-in" : "opacity-0"
    )}
  >
    <div className={cn(
      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
      iconBg
    )}>
      {icon}
    </div>
    <p className="text-sm text-gray-900 font-medium flex-1">{message}</p>
    <button
      onClick={() => toast.dismiss(t.id)}
      className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
    >
      <X className="w-5 h-5" />
    </button>
  </div>
);

export const showSuccessToast = (message: string) => {
  toast.custom((t) => (
    <ToastContainer
      t={t}
      message={message}
      icon={<Check className="w-5 h-5 text-white" />}
      iconBg="bg-gradient-to-br from-green-500 to-emerald-500"
      borderColor="border-green-200"
    />
  ), { duration: 4000 });
};

export const showErrorToast = (message: string) => {
  toast.custom((t) => (
    <ToastContainer
      t={t}
      message={message}
      icon={<AlertCircle className="w-5 h-5 text-white" />}
      iconBg="bg-gradient-to-br from-red-500 to-rose-500"
      borderColor="border-red-200"
    />
  ), { duration: 5000 });
};

export const showInfoToast = (message: string) => {
  toast.custom((t) => (
    <ToastContainer
      t={t}
      message={message}
      icon={<Info className="w-5 h-5 text-white" />}
      iconBg="bg-gradient-to-br from-blue-500 to-cyan-500"
      borderColor="border-blue-200"
    />
  ), { duration: 4000 });
};

export const showWarningToast = (message: string) => {
  toast.custom((t) => (
    <ToastContainer
      t={t}
      message={message}
      icon={<AlertCircle className="w-5 h-5 text-white" />}
      iconBg="bg-gradient-to-br from-yellow-500 to-orange-500"
      borderColor="border-yellow-200"
    />
  ), { duration: 4000 });
};

export const showLoadingToast = (message: string) => {
  return toast.custom((t) => (
    <div
      className={cn(
        "flex items-center gap-3 p-4 bg-white rounded-xl shadow-xl border-2 border-blue-200",
        "transform transition-all duration-300 min-w-[300px]",
        t.visible ? "animate-slide-in" : "opacity-0"
      )}
    >
      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-white animate-spin" />
      </div>
      <p className="text-sm text-gray-900 font-medium">{message}</p>
    </div>
  ), { duration: Infinity });
};

// Promise-based toast for async operations
export const showPromiseToast = async <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  }
): Promise<T> => {
  const loadingToastId = showLoadingToast(messages.loading);
  
  try {
    const result = await promise;
    toast.dismiss(loadingToastId);
    showSuccessToast(messages.success);
    return result;
  } catch (error) {
    toast.dismiss(loadingToastId);
    showErrorToast(messages.error);
    throw error;
  }
};
