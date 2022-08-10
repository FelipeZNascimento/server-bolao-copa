import ResponseObjectClass from './responseObject';
import { TError } from '../const/error_codes';
import { ERROR_CODES, UNKNOWN_ERROR_CODE } from '../const/error_codes';

interface IErrorClass {
  catchError: (error: unknown) => void;
  pushResult: (error: TError) => void;
}

class ErrorClass implements IErrorClass {
  result: TError[];
  request: any;
  response: any;

  constructor(
    result: TError[] = [],
    request: any = null,
    response: any = null
  ) {
    this.result = result;
    this.request = request;
    this.response = response;
  }

  catchError(error: unknown) {
    if (typeof error === 'string') {
      return this.pushResult({
        code: UNKNOWN_ERROR_CODE,
        message: error.toUpperCase()
      });
    } else if (error instanceof Error) {
      return this.pushResult({
        code: UNKNOWN_ERROR_CODE,
        message: error.message
      });
    }

    return this.pushResult(ERROR_CODES.GENERAL_UNKNOWN);
  }

  pushResult(result: TError) {
    this.result.push(result);
  }

  setResult(result: TError[]) {
    this.result = result;
  }

  returnApi() {
    if (!this.response) {
      return;
    }

    const responseObject = new ResponseObjectClass(false, this.result);
    return this.response.send(responseObject);
  }
}

export default ErrorClass;
