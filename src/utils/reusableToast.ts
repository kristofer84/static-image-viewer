import guid from "./guid";
import { ToastPluginApi, ActiveToast, useToast, ToastProps } from "vue-toast-notification";
import { toastProps } from "./toastProps";

export class ReusableToast {
  private toast: ToastPluginApi = useToast(toastProps());
  private toastId: string = guid();
  private el = document.createElement("span");
  private instance: ActiveToast | null = null;

  constructor(initialValue: string, options?: ToastProps | undefined) {
    this.el.id = this.toastId;
    this.el.innerText = initialValue;
    this.instance = this.toast.info(this.el.outerHTML, options);
  }

  dismiss() {
    this.instance?.dismiss();
  }

  public setMessage(value: string) {
    const target = document.getElementById(this.toastId);
    if (target) target.innerText = value;
  }
}
