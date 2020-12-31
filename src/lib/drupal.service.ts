import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, TimeoutError } from 'rxjs';
import { retry, timeout, catchError } from 'rxjs/operators';
import { TokenRequest, TokenResponse } from './model/token_request';
import { DrupalConfig } from './model/drupal_config';
import { DrupalHttpOptions } from './model/options';

@Injectable({
  providedIn: 'root'
})
export class DrupalService {

  userLoginStatus: BehaviorSubject<number> = new BehaviorSubject(0)
  authorization: string = null
  refreshTimeout: any = null

  constructor(private http: HttpClient, 
              @Inject('DRUPAL_TOKEN_SERVICE') private tokenService: DrupalTokenService,
              @Inject('DRUPAL_CONFIG') private drupalConfig: DrupalConfig) { }

  async initialize(): Promise<any> {
    console.info('Drupal Service wurde initialisiert');
    return this.refreshToken();
  }

  login(username: string, password: string): void {
    const request: TokenRequest = {
      grant_type: 'password',
      client_id: this.drupalConfig.client_id,
      client_secret: this.drupalConfig.client_secret,
      scope: this.drupalConfig.scope,
      username: username,
      password: password,
    };
    this.getToken(request);
  }

  logout(): void {
    this.userLoginStatus.next(-1);
    this.authorization = null;
    this.tokenService.deleteRefreshToken().then(() => {
      console.info('Veraltetes Refresh Token wurde entfernt');
    });
  }

  forgotPassword(username: string) {
    const getUrl = window.location;
    const baseUrl = getUrl .protocol + "//" + getUrl.host + "/" + getUrl.pathname.split('/')[1];  
    return this.post('user/api/forgot', {
      username: username,
      url: baseUrl,
    });
  }

  getUserLoginStatus(): Observable<number> {
    return this.userLoginStatus.asObservable();
  }

  getHttpOptions(): DrupalHttpOptions {
    const options = new DrupalHttpOptions(this.authorization);
    return options;
  }

  get(path: string, options: DrupalHttpOptions): Observable<any> {
    return this.http.get(this.drupalConfig.url + '/' + path, options).pipe(
      retry(5),
      timeout(8000),
      catchError(this.formatErrors),
    );
  }

  post(path: string, data: any, options?: DrupalHttpOptions): Observable<any> {
    return this.http.post(this.drupalConfig.url + '/' + path, data, options).pipe(
      retry(3),
      timeout(30000),
      catchError(this.formatErrors),
    );
  }

  patch(path: string, data: any, options?: DrupalHttpOptions): Observable<any> {
    return this.http.patch(this.drupalConfig.url + '/' + path, data, options).pipe(
      retry(3),
      timeout(24000),
      catchError(this.formatErrors),
    );
  }

  private refreshToken(): void {
    this.tokenService.getRefreshToken().then(token => {
      if (token === null) {
        this.userLoginStatus.next(-1);
      }
      else {
        const request: TokenRequest = {
          grant_type: 'refresh_token',
          client_id: this.drupalConfig.client_id,
          client_secret: this.drupalConfig.client_secret,
          refresh_token: token,
        };
        this.getToken(request);
      }
    }).catch(() => {
      this.userLoginStatus.next(-1);
    });
  }

  private getToken(request: TokenRequest): void {
    console.info('Access Token wird erneuert...');
    this.userLoginStatus.next(0);
    const formData = new FormData();
    for (let key in request) {
      formData.set(key, request[key]);
    }
    this.http.post(this.drupalConfig.url + '/' + this.drupalConfig.token_path, formData).pipe(
      retry(3),
      timeout(16000),
      catchError(error => {
        this.userLoginStatus.next(-1);
        this.authorization = null;
        this.tokenService.deleteRefreshToken().then(() => {
          console.info('Veraltetes Refresh Token wurde entfernt');
        });
        return this.formatErrors(error);
      }),
    ).subscribe((response: TokenResponse) => {
      this.authorization = response.token_type + ' ' + response.access_token;
      this.tokenService.setRefreshToken(response.refresh_token);
      this.refreshTimeout = setTimeout(() => {
        this.refreshToken();
      }, (response.expires_in - 30) * 1000);
      console.info('Access Token wurde erneuert');
      this.userLoginStatus.next(1);
    });
  }

  restorePassword(token: string, newPassword: string) {
    return this.post('user/api/restore', {
      token: token,
      password: newPassword
    });
  }

  private formatErrors(error: HttpErrorResponse) {
    console.error('HTTP', error.status);
    if (error instanceof TimeoutError) {
      return throwError('Die Anfrage hat zu lange gedauert');
    }
    switch (error.status) {
      case 422:
      case 500:
        console.warn(error.statusText);
        console.warn(error.message);
        let errorDetails: string = null
        for (let i in error.error['errors']) {
          console.warn('--', error.error['errors'][i]['status'], 
                                error.error['errors'][i]['detail']);
          errorDetails = error.statusText + ': ' + error.error['errors'][i]['detail'];
        }
        if (errorDetails !== null) {
          return throwError(errorDetails);
        }
        return throwError(error.status + ' ' + error.statusText);
        break;
      case 401:
        return throwError('HTTP 401 Ihre Anmeldung ist nicht gültig');
      case 403:
        return throwError('HTTP 403 Zugriff verweigert');
      case 404:
        return throwError('HTTP 404 Nicht gefunden');
      case 412:
        return throwError('HTTP 412 Voraussetzungen nicht erfüllt');
      default:
        console.warn(error.statusText);
        console.warn('--', error.message);
        return throwError(error.message);
    }
    return throwError(error);
  }

}

interface DrupalTokenService {

  getRefreshToken(): Promise<string>
  setRefreshToken(token: string): Promise<any>
  deleteRefreshToken(): Promise<any>

}