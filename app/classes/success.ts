import ResponseObjectClass from './responseObject';
import { IConfig } from './config';
import { IUser } from './user';

type TResult = IUser[] | IConfig;

class SuccessClass {
  private result: TResult;
  private request: any;
  private response: any;

  constructor(result: TResult = [], request: any = null, response: any = null) {
    this.result = result;
    this.request = request;
    this.response = response;
  }

  setResult(result: TResult) {
    this.result = result;
  }

  pushResult(result: IUser) {
    // Only push if array
    if (Array.isArray(this.result)) {
      this.result.push(result);
    }
  }

  returnApi() {
    if (!this.response) {
      return;
    }

    const responseObject = new ResponseObjectClass(true, this.result);
    return this.response.send(responseObject);
  }
}

export default SuccessClass;
