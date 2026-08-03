export type MessageBoxType = 'confirm' | 'info' | 'warning' | 'success' | 'error';

export interface MessageBoxOptions {
  title: string;
  message: string;
  type?: MessageBoxType;
  confirmText?: string;
  cancelText?: string;
}

export interface MessageBoxDialogData extends MessageBoxOptions {
  mode: 'confirm' | 'alert';
}
