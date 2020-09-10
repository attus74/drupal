import { HttpHeaders, HttpParams } from '@angular/common/http';

export class DrupalHttpOptions {

  headers: HttpHeaders = new HttpHeaders()
  params: HttpParams = null

  constructor(authorization: string) {
    this.headers = this.headers.set('Authorization', authorization);
  }

  setParam(name: string, value: any): void {
    if (this.params === null) {
      this.params = new HttpParams();
    }
    this.params = this.params.append(name, value);
  }

}