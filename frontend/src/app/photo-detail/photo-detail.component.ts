import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Location} from "@angular/common";

import {User} from "../_interfaces/user";
import {Photo} from '../_interfaces/photo';
import {UserService} from "../_services/user.service";
import {PhotoService} from '../_services/photo.service';
import {TokenStorageService} from "../_services/token-storage.service";
import {ClipboardService} from "ngx-clipboard";

import {Observable, Subject} from "rxjs";
import {takeUntil} from "rxjs/operators";
import {forkJoin} from "rxjs";

@Component({
  selector: 'app-photo-detail',
  templateUrl: './photo-detail.component.html',
  styleUrls: ['./photo-detail.component.css']
})
export class PhotoDetailComponent implements OnInit, OnDestroy {

  @ViewChild('photo1') set photo1(photo: any) {
    if (photo) {
      this.zoomInInit();
    }
  }

  // current user and photo
  user?: User;
  photo?: Photo;

  // if user was the one who uploaded the photo
  isPhotoOwner = false;

  // other photo info in relation to the current user
  isPhotoLiked = false;
  isPhotoFavourited = false;
  isRequestInProgress = false;

  // if share link was clicked, show message
  hasShareLinkBeenClicked = false;

  // component wise error message
  errorMessage?: string;

  // subject to multicast a http requests cancellation to multiple observers
  ngUnsubscribe: Subject<void> = new Subject<void>();

  constructor(private route: ActivatedRoute,
              private userService: UserService,
              private photoService: PhotoService,
              private tokenStorage: TokenStorageService,
              private router: Router,
              private location: Location,
              private clipboard: ClipboardService) {
  }

  ngOnInit(): void {
    this.getPhotoAndGetUser();
  }

  ngOnDestroy(): void {
    // This aborts all HTTP requests.
    this.ngUnsubscribe.next();
    // This completes the subject properly.
    this.ngUnsubscribe.complete();
  }

  /**
   * Get photo and user.
   */
  getPhotoAndGetUser() {

    // if user is not logged in, only get the photo
    if (!this.tokenStorage.getToken()) {
      // if there's an error, then the image doesnt exist go to not found page
      this.getPhoto().subscribe(photo => {
        this.photo = photo;

      }, err => {
        // if photo was not found, redirect to page-not-found
        this.router.navigate(["404"], {queryParams: {redirected: 'true'}});
      });

      return;
    }

    this.getUser().then(() => {
      this.getPhoto().subscribe(data => {
          this.photo = data;

          // photo not existant
          if (!this.photo) {
            this.router.navigate(["404"], {queryParams: {redirected: 'true'}});
          } else if (this.user) {
            if (this.user.photoList.includes(this.photo._id)) {
              this.isPhotoOwner = true;
            }

            if (this.user.likedPhotoList.includes(this.photo._id)) {
              this.isPhotoLiked = true;
            }

            if (this.user.favouritePhotoList.includes(this.photo._id)) {
              this.isPhotoFavourited = true;
            }
          }

        },
        err => this.router.navigate(["404"], {queryParams: {redirected: 'true'}}));
    });
  }

  /**
   * Change this.user with the current user info if user is logged in.
   */
  async getUser(): Promise<void> {
    if ( this.user )
      return;

    // user is logged in
    if (this.tokenStorage.getToken()) {
      return new Promise<void>(resolve => this.userService.getUserByUsername(this.tokenStorage.getUser().username).subscribe(data => {
        this.user = data;
        resolve();
      }, err => {
        this.errorMessage = err.error.message;
        resolve()
      }));
    }


    // user is not logged in
    return;
  }

  getPhoto(): Observable<Photo> {
    const id = String(this.route.snapshot.paramMap.get('id'));
    return this.photoService.getPhoto(id).pipe(takeUntil(this.ngUnsubscribe));
  }

  deletePhoto(): void {
    if (!confirm("Press confirm to delete this photo."))
      return;

    if (this.user) {
      const id = String(this.route.snapshot.paramMap.get('id'));
      this.photoService.deletePhoto(id).subscribe();

      // remove element from list, we want to mantain order
      this.user.photoList = this.user.photoList.filter(function (e) {
        return e !== id;
      });

      this.userService.updateUser(this.user).subscribe(() => this.location.back());
    }
  }

  /**
   * Copy current url to clipboard.
   */
  shareLinkToClipboard(): void {
    this.clipboard.copy(window.location.href);

    this.hasShareLinkBeenClicked = true;
  }

  /**
   * If user is logged in, like current photo.
   */
  likePhoto() {
    if (!this.photo || !this.user || this.isRequestInProgress)
      return;

    this.isRequestInProgress = true;

    // like the photo
    if (!this.isPhotoLiked) {

      // we put this here instead of inseide the subscribe below so when the user clicks the button it's instant
      this.photoService.changePhotoLikes(this.photo._id, this.user._id, true, this.user.likedPhotoList).subscribe(() => {
        // @ts-ignore
        this.user.likedPhotoList.push(this.photo._id);
        // @ts-ignore
        this.photo.likes++;
        this.isPhotoLiked = true;
        this.isRequestInProgress = false;
      }, err => {
        this.errorMessage = err.error.message;
        // @ts-ignore
        this.isLikeRequestInProgress = false;
      });

      // remove like
    } else {
      this.photoService.changePhotoLikes(this.photo._id, this.user._id, false, this.user.likedPhotoList).subscribe(() => {
        this.isPhotoLiked = false;
        // @ts-ignore
        this.photo.likes--;

        // @ts-ignore
        this.user.likedPhotoList = this.user.likedPhotoList.filter((element) => {
          // @ts-ignore
          return element !== this.photo._id;
        })

        this.isRequestInProgress = false;
      }, err => {
        this.errorMessage = err.error.message;
        this.isRequestInProgress = false;
      });
    }
  }

  /**
   * If user is logged in, favourite photo.
   */
  favouritePhoto() {
    if (!this.user || !this.photo || this.isRequestInProgress)
      return;

    this.isRequestInProgress = true;

    // favourite photo
    if (!this.isPhotoFavourited) {
      this.user.favouritePhotoList.push(this.photo._id);

      // modify user with new favourite photo
      this.userService.updateUser(this.user).subscribe(() => {
        this.isPhotoFavourited = true;
        this.isRequestInProgress = false;
      }, err => {
        this.errorMessage = err.error.message;
        // @ts-ignore
        this.user.favouritePhotoList.pop();
        this.isRequestInProgress = false;
      });
    }
    // remove favourite from photo
    else {

      // remove photo id from favouritePhotoList
      const newFavouritePhotoList: string[] = [];
      this.user.favouritePhotoList.forEach(element => {
        // @ts-ignore
        if (element !== this.photo._id) {
          newFavouritePhotoList.push(element);
        }
      });

      this.user.favouritePhotoList = newFavouritePhotoList;

      // modify user with new favourite photo
      this.userService.updateUser(this.user).subscribe(() => {
        this.isPhotoFavourited = false;
        this.isRequestInProgress = false;
      }, err => {
        this.errorMessage = err.error.message;
        // @ts-ignore
        this.user.favouritePhotoList.append(this.photo._id);
        this.isRequestInProgress = false;
      });

    }
  }

  /**
   * Method to zoom in image when clicked.
   */
  private zoomInInit() {
    // get photo html element
    const photoElement = (<HTMLInputElement>document.getElementsByClassName("zoomD")[0]);

    // attach click event to photo
    photoElement.addEventListener("click", function () {

      this.classList.remove("zoomD");

      // create clone (that will be magnified)
      const clone = this.cloneNode();

      this.classList.add("zoomD");

      // put clone into lightbox
      const lightboxElement = (<HTMLInputElement>document.getElementById("lb-img"));
      lightboxElement.innerHTML = "";
      lightboxElement.appendChild(clone);

      // show lightbox
      (<HTMLInputElement>document.getElementById("lb-back")).classList.add("show");
    });

    // attach click event to hide lightbox
    (<HTMLInputElement>document.getElementById("lb-back")).addEventListener("click", function () {
      this.classList.remove("show");
    })
  }
}
