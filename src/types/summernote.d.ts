// Temporary boundary for the existing CDN editor; removed with the common Markdown editor.
interface SummernoteOptions {
  height: number;
  width?: number;
  minHeight: number | null;
  maxHeight: number | null;
  focus: boolean;
  toolbar: [string, string[]][];
}
declare function $(selector: string): {
  summernote(command: 'code'): string;
  summernote(options: SummernoteOptions): void;
};
