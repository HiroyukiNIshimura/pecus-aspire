import { IStaticMethods } from "flyonui/flyonui";

declare global {
  interface Window {
    // Optional third-party libraries
    HSStaticMethods: IStaticMethods;
    HSAccordion: typeof HSAccordion;
  }
}
