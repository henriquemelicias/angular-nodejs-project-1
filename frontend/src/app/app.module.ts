import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {AppRoutingModule} from './app-routing.module';

import {AppComponent} from './app.component';
import {LoginComponent} from './login/login.component';
import {RegisterComponent} from './register/register.component';
import {HomeComponent} from './home/home.component';
import {ProfileComponent} from './profile/profile.component';
import {AddPhotoComponent} from "./add-photo/add-photo.component";

import {AuthInterceptorProviders} from './_interceptors/auth.interceptor';
import {PageNotFoundComponent} from './page-not-found/page-not-found.component';
import {PhotoDetailComponent} from './photo-detail/photo-detail.component';
import {CommonModule} from "@angular/common";

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    HomeComponent,
    ProfileComponent,
    AddPhotoComponent,
    PageNotFoundComponent,
    PhotoDetailComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    CommonModule
  ],
  providers: [AuthInterceptorProviders],
  bootstrap: [AppComponent]
})
export class AppModule {
}
