declare module 'pristinejs' {
  export default class Pristine {
    constructor(
      form: HTMLFormElement,
      config?: {
        classTo?: string;
        errorClass?: string;
        successClass?: string;
        errorTextParent?: string;
        errorTextTag?: string;
        errorTextClass?: string;
      },
    );

    validate(input?: HTMLInputElement | HTMLTextAreaElement): boolean;
    addError(input: HTMLInputElement | HTMLTextAreaElement, message: string): void;
    reset(): void;
    destroy(): void;
  }
}
