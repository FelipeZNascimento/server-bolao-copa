class ResponseObjectClass {
  timestamp: Date;
  isSuccess: boolean;
  result: any;
  code: number;

  constructor(isSuccess: boolean, result: any, code: number = 200) {
    this.timestamp = new Date();
    this.result = result;
    this.isSuccess = isSuccess;
    this.code = code;
  }
}

export default ResponseObjectClass;
