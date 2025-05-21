export interface Request<T> {
  request: Promise<T>;
  cancel?: () => void;
}
