import ResponseObjectClass from './responseObject';

class SuccessClass {
  private result: any[];
  private request: any;
  private response: any;

  constructor(result: any = [], request: any = null, response: any = null) {
    this.result = result;
    this.request = request;
    this.response = response;
  }

  setResult(result: any) {
    this.result = result;
  }

  pushResult(result: any) {
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
