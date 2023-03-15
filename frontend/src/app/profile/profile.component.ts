import {Component, OnDestroy, OnInit} from '@angular/core';
import {TokenStorageService} from '../_services/token-storage.service';
import {UserService} from '../_services/user.service';
import {PhotoService} from '../_services/photo.service';
import {ActivatedRoute, Router} from "@angular/router";
import {Subject} from "rxjs";
import {takeUntil} from "rxjs/operators";
import {User} from "../_interfaces/user";
import {ClipboardService} from "ngx-clipboard";
import {Thumbnail} from "../_interfaces/thumbnail";

const LOADING_IMG_SRC = "../assets/loading-image.gif";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnDestroy {

  // current user
  user?: User;
  currentUser: any;

  // name showcase on top of the page
  jumboTronUsernameShowcase: string = "";

  // current state flags
  isPhotoListIndexed = false;
  hasPhotos = false;
  hasFavourites = false;
  isIndexingPhotos = true;

  // possible thumbnails showcase selection values
  selectValues = ['Uploads', 'Favourites'];
  defaultSelectValue = this.selectValues[0];
  selectHorizontalText = "Latest to oldest";
  selectVerticalText = "Oldest to latest";

  // thumbnails to be shown
  thumbnails: Array<Thumbnail> = [];

  // subject to multicast a http requests cancellation to multiple observers
  ngUnsubscribe: Subject<void> = new Subject<void>();

  // component wise error message
  errorMsg?: string;

  constructor(private route: ActivatedRoute,
              private router: Router,
              private token: TokenStorageService,
              private userService: UserService,
              private photoService: PhotoService,
              private clipboard: ClipboardService) {
  }

  ngOnInit(): void {
    this.currentUser = this.token.getUser();

    if (this.currentUser.username.length <= 20) {
      this.jumboTronUsernameShowcase = this.currentUser.username + "'s";
    }

    // parameter query
    this.route.queryParams.subscribe(params => {
      // if there's no sort param, add default sort by date query
      if (params.list === undefined) {
        this.changeQuery({list: "uploads"});
        return;
      }

      // showcase uploaded photos thumbnails
      if (params.list === "uploads") {
        this.defaultSelectValue = this.selectValues[0];
        this.thumbnails = [];
        this.getCurrentUserPhotos();
      }
      // showcase favourited photos thumbnails
      else if (params.list === "favourites") {
        this.defaultSelectValue = this.selectValues[1];
        this.thumbnails = [];
        this.getFavouritedUserPhotos();
      }
      // sort has no known attribute
      else {
        // use default query
        this.changeQuery({list: "uploads"});
      }
    });
  }

  ngOnDestroy(): void {
    // This aborts all HTTP requests.
    this.ngUnsubscribe.next();
    // This completes the subject properly.
    this.ngUnsubscribe.complete();
  }

  async getUser(): Promise<void> {
    // user is logged in
    if (this.token.getToken()) {
      return new Promise<void>(resolve => this.userService.getUserByUsername(this.token.getUser().username).subscribe(data => {
        this.user = data;
        resolve();
      }, err => {
        this.errorMsg = err.error.message;
        this.isPhotoListIndexed = true
        resolve()
      }));
    }

    // user is not logged in
    return;
  }

  private getFavouritedUserPhotos() {
    // get current user if not queried
    this.getUser().then( () => {
      if ( this.user ) {
        // if user favourites list is empty
        if (this.user.favouritePhotoList.length == 0) {
          this.isPhotoListIndexed = true;
          this.isIndexingPhotos = false;
          return;
        }

        this.hasFavourites = true;
        this.thumbnails = new Array(this.user.favouritePhotoList.length).fill({base64Thumbnail: LOADING_IMG_SRC});

        // get all thumbnails from user favouritedPhotosList
        for (let i = this.user.favouritePhotoList.length - 1; i >= 0; i--) {
          this.photoService.getPhotoThumbnail(this.user.favouritePhotoList[i])
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(photo => {

              // this should never happen
              if (!this.user)
                return;

              // put the thumbnail info on the thumbnails list to be shown
              this.thumbnails[this.user.favouritePhotoList.length - i - 1] = {
                _id: this.user.favouritePhotoList[i],
                base64Thumbnail: photo.base64Thumbnail,
                name: photo.name,
                description: photo.description,
                flags: {
                  isPhotoLiked: this.user.likedPhotoList.includes(this.user.favouritePhotoList[i]),
                  isPhotoFavourited: this.user.favouritePhotoList.includes(this.user.favouritePhotoList[i]),
                  isRequestInProgress: false
                }
              };

              this.isPhotoListIndexed = true;
            });

          if (i == this.user.favouritePhotoList.length - 1) {
            this.isIndexingPhotos = false;
          }
        }
      }
    })
  }

  getCurrentUserPhotos(): void {
    // get current user if not queried
    this.getUser().then(() => {
      if (this.user) {

        // if user photoList is empty
        if (this.user.photoList.length == 0) {
          this.isPhotoListIndexed = true;
          this.isIndexingPhotos = false;
          return;
        }

        this.hasPhotos = true;
        this.thumbnails = new Array(this.user.photoList.length).fill({base64Thumbnail: LOADING_IMG_SRC});

        // get all thumbnails from user photoList
        for (let i = this.user.photoList.length - 1; i >= 0; i--) {
          this.photoService.getPhotoThumbnail(this.user.photoList[i])
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(photo => {

              // this should never happen
              if (!this.user)
                return;

              // put the thumbnail info on the thumbnails list to be shown
              this.thumbnails[this.user.photoList.length - i - 1] = {
                _id: this.user.photoList[i],
                base64Thumbnail: photo.base64Thumbnail,
                name: photo.name,
                description: photo.description,
                flags: {
                  isPhotoLiked: this.user.likedPhotoList.includes(this.user.photoList[i]),
                  isPhotoFavourited: this.user.favouritePhotoList.includes(this.user.photoList[i]),
                  isRequestInProgress: false
                }
              };

              this.isPhotoListIndexed = true;
            });

          if (i == this.user.photoList.length - 1) {
            this.isIndexingPhotos = false;
          }
        }
      }
    })
  }

  onKeyDownEvent(id: string) {
    this.router.navigate(["/photo/" + id]);
  }

  /**
   * Deletes photo when called through mouse event.
   */
  callPhotoDelete($event: MouseEvent, id: string, indexOfPhoto: number) {
    // parent will not be clicked
    $event.stopPropagation();

    if (!confirm("Press confirm to delete this photo."))
      return;

    if (this.user) {
      this.photoService.deletePhoto(id).subscribe();
      this.deletePhoto(this.user, id, indexOfPhoto);
    }
  }

  deletePhoto(user: User, photoId: string, indexOfPhoto: number) {
    // remove element from list, we want to mantain order
    user.photoList = user.photoList.filter(function (e: string) {
      return e !== photoId;
    });

    this.userService.updateUser(user).subscribe(() => {
      delete this.thumbnails[indexOfPhoto];
    }, err => this.errorMsg = err.error.message);
  }

  /**
   * When the share link button in the thumbnail is clicked.
   */
  shareLinkToClipboard($event: MouseEvent, photoId: string): void {
    // parent will not be clicked
    $event.stopPropagation();

    this.clipboard.copy(window.location.origin + "/photo/" + photoId);

    const clipboardAlertElement = (<HTMLInputElement>document.createElement("h1"));
    clipboardAlertElement.innerHTML = "Link copied!";
    clipboardAlertElement.classList.add("link-to-clipboard-alert");

    // get shareLinkToClipoard
    const clipboardButtonElement = (<HTMLInputElement>document.getElementById("link-to-clipboard-alert-" + photoId));

    if (clipboardButtonElement) {

      if (!clipboardButtonElement.classList.contains("hidden"))
        return;

      clipboardButtonElement.classList.remove("hidden");

      setTimeout(() => {
        clipboardButtonElement.classList.add("hidden");
      }, 1500);
    }
  }

  /**
   * When the like button in the thumbnail is clicked.
   */
  likePhoto($event: MouseEvent, thumbnail: Thumbnail) {
    // parent will not be clicked
    $event.stopPropagation();

    if (!this.user || thumbnail.flags.isRequestInProgress)
      return;

    thumbnail.flags.isRequestInProgress = true;

    // like the photo
    if (!thumbnail.flags.isPhotoLiked) {

      this.photoService.changePhotoLikes(thumbnail._id, this.user._id, true, this.user.likedPhotoList).subscribe(() => {
        // @ts-ignore
        this.user.likedPhotoList.push(thumbnail._id); // to ensure that if a favourite is done right after, it has the most recent data
        thumbnail.flags.isPhotoLiked = true;
        thumbnail.flags.isRequestInProgress = false;
      }, err => {
        this.errorMsg = err.error.message;
        thumbnail.flags.isRequestInProgress = false;
      });

      // remove like
    } else {
      this.photoService.changePhotoLikes(thumbnail._id, this.user._id, false, this.user.likedPhotoList).subscribe(() => {
        // @ts-ignore
        this.user.likedPhotoList = this.user.likedPhotoList.filter(function (element) {
          return element !== thumbnail._id;
        });
        thumbnail.flags.isPhotoLiked = false;
        thumbnail.flags.isRequestInProgress = false;
      }, err => {
        this.errorMsg = err.error.message;
        thumbnail.flags.isRequestInProgress = false;
      });
    }
  }

  favouritePhoto($event: MouseEvent, thumbnail: Thumbnail) {
    // parent will not be clicked
    $event.stopPropagation();

    if (!this.user || thumbnail.flags.isRequestInProgress)
      return;

    thumbnail.flags.isRequestInProgress = true;

    // favourite photo
    if (!thumbnail.flags.isPhotoFavourited) {
      this.user.favouritePhotoList.push(thumbnail._id);

      // modify user with new favourite photo
      this.userService.updateUser(this.user).subscribe(() => {
        thumbnail.flags.isPhotoFavourited = true;
        thumbnail.flags.isRequestInProgress = false;
      }, err => {
        this.errorMsg = err.error.message;
        // @ts-ignore
        this.user.favouritePhotoList.pop();
        thumbnail.flags.isRequestInProgress = false;
      });
    }
    // remove favourite from photo
    else {
      // remove photo id from favouritePhotoList
      const newFavouritePhotoList: string[] = [];
      this.user.favouritePhotoList.forEach(element => {
        // @ts-ignore
        if (element !== thumbnail._id) {
          newFavouritePhotoList.push(element);
        }
      });

      this.user.favouritePhotoList = newFavouritePhotoList;

      // modify user with new favourite photo
      this.userService.updateUser(this.user).subscribe(() => {
        thumbnail.flags.isPhotoFavourited = false;
        thumbnail.flags.isRequestInProgress = false;
      }, err => {
        this.errorMsg = err.error.message;
        // @ts-ignore
        this.user.favouritePhotoList.append(this.thumbnail._id);
        thumbnail.flags.isRequestInProgress = false;
      });

    }
  }

  changeSelection(event: any): void {
    // list by uploads
    if (+event.target.value[0] === 0) {
      this.changeQuery({list: "uploads"});
    }
    // list by favourited
    else if (+event.target.value[0] === 1) {
      this.changeQuery({list: "favourites"});
    }
  }

  private changeQuery(paramsDict: any) {
    this.router.navigate(
      [],
      {
        relativeTo: this.route,
        queryParams: paramsDict,
      });
  }
}
