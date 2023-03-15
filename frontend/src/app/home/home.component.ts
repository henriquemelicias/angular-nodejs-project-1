import {Component, OnInit, OnDestroy} from '@angular/core';
import {PhotoService} from '../_services/photo.service';
import {TokenStorageService} from '../_services/token-storage.service';
import {ActivatedRoute, Router} from "@angular/router";
import {Subject} from "rxjs";
import {takeUntil} from "rxjs/operators";
import {ClipboardService} from "ngx-clipboard";
import {User} from "../_interfaces/user";
import {Thumbnail} from "../_interfaces/thumbnail";
import {UserService} from "../_services/user.service";

const LOADING_IMG_SRC = "../assets/loading-image.gif";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {

  // current user
  user?: User;

  // thumbnails to be shown
  thumbnails: Array<Thumbnail> = [];

  // if client received the ids of the photos to be shown
  isPhotoListIndexed = false;

  // src image for loading gif
  loadingImg = LOADING_IMG_SRC;

  // possible sort selection values
  sortValues = ['Date', 'Likes'];
  defaultSortValue = this.sortValues[0];
  sortHorizontalText = "";
  sortVerticalText = "";

  // subject to multicast a http requests cancellation to multiple observers
  ngUnsubscribe: Subject<void> = new Subject<void>();

  // component wise error message
  errorMsg?: string;

  constructor(private route: ActivatedRoute,
              private router: Router,
              private tokenStorageService: TokenStorageService,
              private userService: UserService,
              private photoService: PhotoService,
              private clipboard: ClipboardService) {
  }

  ngOnInit(): void {
    // parameter query
    this.route.queryParams.subscribe(params => {
      // if there's no sort param, add default sort by date query
      if (params.sort === undefined) {
        this.changeQuery({sort: "date"});
        return;
      }

      // sort by date query
      if (params.sort === "date") {
        this.defaultSortValue = this.sortValues[0];
        this.sortHorizontalText = "Latest to oldest";
        this.sortVerticalText = "Oldest to latest";
        this.thumbnails = [];
        this.getPhotosThumbnailsByDate();
      }
      // sort by likes query
      else if (params.sort === "likes") {
        this.defaultSortValue = this.sortValues[1];
        this.sortHorizontalText = "Most liked to least";
        this.sortVerticalText = "Least liked to most";
        this.thumbnails = [];
        this.getPhotosThumbnailsByLikes();
      }
      // sort has no known attribute
      else {
        // use default query
        this.changeQuery({sort: "date"});
      }
    });
  }

  ngOnDestroy(): void {
    // This aborts all HTTP requests.
    this.ngUnsubscribe.next();
    // This completes the subject properly.
    this.ngUnsubscribe.complete();
  }

  /**
   * Change url with the new query params specified.
   *
   * @param paramsDict query params to change url. e.g. {sort: "date"}.
   */
  changeQuery(paramsDict: any) {
    this.router.navigate(
      [],
      {
        relativeTo: this.route,
        queryParams: paramsDict,
      });
  }

  /**
   * Change this.user with the current user info if user is logged in.
   */
  async getUser(): Promise<void> {
    // user was already queried
    if (this.user)
      return;

    // user is logged in
    if (this.tokenStorageService.getToken()) {
      return new Promise<void>(resolve => this.userService.getUserByUsername(this.tokenStorageService.getUser().username).subscribe(data => {
        this.user = data;
        resolve();
      }, err => {
        this.errorMsg = err.error.message;
        resolve()
      }));
    }

    // user is not logged in
    return;
  }

  getPhotosThumbnailsByDate(): void {
    this.getUser().then(() => {
      this.photoService.getRecentPhotosId().pipe(takeUntil(this.ngUnsubscribe)).subscribe(photosInfoList => {
        // temporarily fills thumbnails list with loading gif
        this.thumbnails = new Array(photosInfoList.length).fill({base64Thumbnail: LOADING_IMG_SRC})

        // get thumbnails
        photosInfoList.forEach(photoInfo => this.getPhotoThumbnail(photoInfo._id, photoInfo.index));
        this.isPhotoListIndexed = true;
      });
    })
  }

  private getPhotosThumbnailsByLikes() {
    this.getUser().then(() => {
      this.photoService.getMostLikedPhotosId().pipe(takeUntil(this.ngUnsubscribe)).subscribe(photosInfoList => {
        // temporarily fills thumbnails list with loading gif
        this.thumbnails = new Array(photosInfoList.length).fill({base64Thumbnail: LOADING_IMG_SRC})

        // get thumbnails
        photosInfoList.forEach(photoInfo => this.getPhotoThumbnail(photoInfo._id, photoInfo.index));
        this.isPhotoListIndexed = true;
      });
    })
  }

  /**
   * Get photo thumbnail with the specified id and puts it on the specified index in the thumbnails list.
   * @param id
   * @param index
   */
  getPhotoThumbnail(id: string, index: number): void {
    this.photoService.getPhotoThumbnail(id).pipe(takeUntil(this.ngUnsubscribe)).subscribe(photo => {
      this.thumbnails[index] = {
        _id: id,
        base64Thumbnail: photo.base64Thumbnail,
        name: photo.name,
        description: photo.description,
        flags: {
          isPhotoLiked: (this.user) ? this.user.likedPhotoList.includes(id) : false,
          isPhotoFavourited: (this.user) ? this.user.favouritePhotoList.includes(id) : false,
          isRequestInProgress: false
        }
      }
    });
  }

  /**
   * When photo thumbnail is selected. Navigate to the photo's webpage.
   *
   * @param id selected photo id.
   */
  onKeyDownEvent(id: string) {
    this.router.navigate(["/photo/" + id]);
  }

  /**
   * Select a new option in the sort selection menu with the selection event.
   */
  sortSelection(event: any): void {
    // sort by date
    if (+event.target.value[0] === 0) {
      this.changeQuery({sort: "date"});
    }
    // sort by likes
    else if (+event.target.value[0] === 1) {
      this.changeQuery({sort: "likes"});
    }
  }

  /**
   * When the share link button in the thumbnail is clicked.
   */
  shareLinkToClipboard($event: MouseEvent, photoId: string) {
    // parent will not be clicked
    $event.stopPropagation();

    // copy photo link to clipboard
    this.clipboard.copy(window.location.origin + "/photo/" + photoId);

    // show clipboard alert message
    const clipboardAlertElement = (<HTMLInputElement>document.createElement("h1"));
    clipboardAlertElement.innerHTML = "Link copied!";
    clipboardAlertElement.classList.add("link-to-clipboard-alert");

    // get shareLinkToClipoard
    const clipboardButtonElement = (<HTMLInputElement>document.getElementById("link-to-clipboard-alert-" + photoId));

    if (clipboardButtonElement) {

      if (!clipboardButtonElement.classList.contains("hidden"))
        return;

      clipboardButtonElement.classList.remove("hidden");

      // remove alert message after 1500 ms
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
        // @ts-ignore
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
        // @ts-ignore
        this.user.likedPhotoList.push(thumbnail._id);
        thumbnail.flags.isRequestInProgress = false;
      });
    }
  }

  /**
   * When the favourite photo button in the thumbnail is clicked.
   */
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
        thumbnail.flags.isRequestInProgress = false;
        thumbnail.flags.isPhotoFavourited = false;
      }, err => {
        this.errorMsg = err.error.message;
        thumbnail.flags.isPhotoFavourited = true;
        // @ts-ignore
        this.user.favouritePhotoList.append(thumbnail._id);
        thumbnail.flags.isRequestInProgress = false;
      });

    }
  }
}
