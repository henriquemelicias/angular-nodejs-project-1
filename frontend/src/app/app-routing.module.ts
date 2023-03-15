import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {RegisterComponent} from './register/register.component';
import {LoginComponent} from './login/login.component';
import {HomeComponent} from './home/home.component';
import {ProfileComponent} from './profile/profile.component';
import {AddPhotoComponent} from './add-photo/add-photo.component'
import {PageNotFoundComponent} from './page-not-found/page-not-found.component';
import {PhotoDetailComponent} from './photo-detail/photo-detail.component';

import {AuthGuard} from './_guard/auth.guard';

const routes: Routes = [
  {path: 'home', component: HomeComponent},
  {path: 'login', component: LoginComponent},
  {path: 'register', component: RegisterComponent},
  {path: 'photo/:id', component: PhotoDetailComponent},
  {path: 'profile', component: ProfileComponent, canActivate: [AuthGuard]},
  {path: 'add-photo', component: AddPhotoComponent, canActivate: [AuthGuard]},
  {path: '', redirectTo: 'home', pathMatch: 'full'},

  // route not found/inexistent
  { path: '404', component: PageNotFoundComponent },
  { path: '**', component: PageNotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
