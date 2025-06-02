export interface Result<T, E> {
  isSuccess(): boolean;
  getValue(): T;
  getError(): E;
}

export class SuccessResult<T, E> implements Result<T, E> {
  constructor(private value: T) {}
  
  isSuccess(): boolean {
    return true;
  }
  
  getValue(): T {
    return this.value;
  }
  
  getError(): E {
    throw new Error('Cannot get error from success result');
  }
}

export class ErrorResult<T, E> implements Result<T, E> {
  constructor(private error: E) {}
  
  isSuccess(): boolean {
    return false;
  }
  
  getValue(): T {
    throw new Error('Cannot get value from error result');
  }
  
  getError(): E {
    return this.error;
  }
}

// Factory functions for easier usage
export const success = <T, E>(value: T): Result<T, E> => new SuccessResult(value);
export const error = <T, E>(err: E): Result<T, E> => new ErrorResult(err);

// Type guard functions
export const isSuccess = <T, E>(result: Result<T, E>): result is SuccessResult<T, E> => 
  result.isSuccess();

export const isError = <T, E>(result: Result<T, E>): result is ErrorResult<T, E> => 
  !result.isSuccess(); 