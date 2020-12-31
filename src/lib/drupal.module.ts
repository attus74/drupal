import { NgModule, APP_INITIALIZER } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { DrupalComponent } from './drupal.component';
import { DrupalService } from './drupal.service';


@NgModule({
  declarations: [DrupalComponent],
  imports: [
    HttpClientModule,
  ],
  providers: [
    DrupalService,
    {
      provide: APP_INITIALIZER,
      useFactory: (drupal: DrupalService) => {
        return () => drupal.initialize()
      },
      deps: [DrupalService],
      multi: true
    }
  ],
  exports: [DrupalComponent]
})
export class DrupalModule { }
