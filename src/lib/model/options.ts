import { HttpHeaders, HttpParams } from '@angular/common/http';

export class DrupalHttpOptions {

  headers: HttpHeaders = new HttpHeaders()
  params: HttpParams = null
  responseType = null

  constructor(authorization: string) {
    this.headers = this.headers.set('Authorization', authorization);
  }

  setHeaders(name: any, value: any): void {
    this.headers = this.headers.set(name, value);
  }

  setParam(name: string, value: any): void {
    if (this.params === null) {
      this.params = new HttpParams();
    }
    this.params = this.params.append(name, value);
  }

  setResponseType(type: any): void {
    this.responseType = type;
  }

}