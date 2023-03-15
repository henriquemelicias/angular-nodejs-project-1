import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

import {User} from '../_interfaces/user';
import {UserService} from '../_services/user.service';
import {PhotoService} from '../_services/photo.service';
import {TokenStorageService} from '../_services/token-storage.service';
import {forkJoin} from "rxjs";
import {HttpEventType} from "@angular/common/http";

@Component({
  selector: 'app-add',
  templateUrl: './add-photo.component.html',
  styleUrls: ['./add-photo.component.css']
})
export class AddPhotoComponent implements OnInit {

  constructor(private route: ActivatedRoute,
              private userService: UserService,
              private photoService: PhotoService,
              private tokenStorageService: TokenStorageService) {
  }

  // current user
  user?: User;

  // information of files uploaded
  filesInfo: {
    fileName: string,
    photoBase64: string,
    photoName: string,
    photoDescription: string
  }[] = [];

  // list of progress bars
  progressInfo: { fullFileName: string, value: number, errorMsg?: string }[] = []

  isUploading = false;
  hasStartedFirstUpload = false;

  // prompt to insert new name and/or description if able
  isPromptOpen = false;
  // current file selected to be modified by form in prompt
  currentPromptFileIndex: number = 0;

  // error messages when selecting new files to be uploaded
  fileSelectionMessages: string[] = [];

  // component wise error message
  message ?: string;

  ngOnInit(): void {
  }

  /**
   * Executed when photos are selected.
   * @param event event with the photos from input
   */
  onPhotosInput(event: any): void {
    // resets variables
    this.message = undefined;
    this.fileSelectionMessages = [];
    this.filesInfo = [];
    this.progressInfo = [];
    this.currentPromptFileIndex = 0;

    // if there's only one file, open prompt
    if (event.target.files.length == 1) {
      this.isPromptOpen = true;
    }
    // if there's more than one file, close prompt (prompt needs user confirmation so he can edit every single file)
    else if (event.target.files.length > 1) {
      this.isPromptOpen = false;
    }

    // if multiples files, check if valid and add to filesInfo list
    for (let i = 0; i < event.target.files.length; i++) {
      this.addToFilesInfo(event.target.files[i]);
    }
  }

  /**
   * Checks and, if valid, adds new photo to filesInfo.
   *
   * @param file file to add to filesInfo.
   */
  addToFilesInfo(file: File) {
    // ensure it's an image
    if (!file.type.match("image.*")) {
      this.fileSelectionMessages.push('Skipping file: ' + file.name + ' -> file is not an image.');
      return;
    }

    // ensure it's an image format that is supported
    if (!file.type.match("(image.jpeg|image.png|image.webp|image.gif)")) {
      this.fileSelectionMessages.push('Skipping file: ' + file.name + ' -> image format "' + file.type.split("/")[1] + '" is not supported.');
      return;
    }

    // ensure is below limit size
    // 13 megabits
    const maxSizeBits = 13_000_000;
    const fileSize = file.size;

    if (fileSize > maxSizeBits) {
      this.fileSelectionMessages.push('Skipping file: ' + file.name + ' -> file size ('
        + Math.round(fileSize / Math.pow(10, 6)) + 'MB) is above the limit: ' +
        Math.round(maxSizeBits / Math.pow(10, 6)) + ' MB.');
      return;
    }

    // convert photo to Base64
    this.generateImgBase64(file, base64 => {

      // new object in the progression array
      this.filesInfo[this.filesInfo.length] = {
        fileName: file.name.split('\.')[0],
        photoBase64: base64,
        photoName: "",
        photoDescription: ""
      };

      // new progress bar
      this.progressInfo[this.filesInfo.length - 1] = {
        fullFileName: file.name,
        value: 0
      };
    });
  }

  /**
   * Generates a base64 from a specified photo.
   * @param file file of the photo to generate a base64 string.
   * @param callback returns the base64 result as string
   */
  generateImgBase64(file: any, callback: (result: any) => void): void {
    const reader = new FileReader();

    reader.onload = (e: any) => {
      const image = new Image;

      image.onload = () => {
        callback(e.target.result);
      };

      image.src = e.target.result;
    };

    reader.readAsDataURL(file);
  }

  /**
   * Uploads all photos in filesInfo.
   */
  async savePhotos() {

    this.fileSelectionMessages = [];

    // if there's only one file and there's no description prompt the user to continue
    if (this.filesInfo.length == 1 && this.filesInfo[0].photoDescription.length === 0) {
      if (!confirm('Press confirm to proceed without an image description.')) {
        return;
      }
    }
      // if there's multiple files and prompt has not been open yet, ask if the user wants to edit the description of
    // the files before their upload
    else if (this.filesInfo.length > 1 && !this.isPromptOpen) {
      if (confirm('Press confirm if you wish to edit your files description before uploading.')) {
        this.isPromptOpen = true;
        this.highLightPromptFile(this.currentPromptFileIndex, true);
        return;
      }
    }

    // resets to default value
    this.isPromptOpen = false;

    // we are going to flag that the first upload (in this route change) has started
    if (!this.hasStartedFirstUpload)
      this.hasStartedFirstUpload = true;

    this.isUploading = true;

    // list of promises
    const fileUploadPromises = [];
    for (let i = 0; i < this.filesInfo.length; i++) {
      fileUploadPromises.push(this.upload(i));
    }

    // wait for all file uploads to finish
    forkJoin(fileUploadPromises).subscribe(() => {
      this.message = "Upload finished!";
      this.isUploading = false;
      this.filesInfo = [];
    }, err => this.message = err.error.message)
  };

  /**
   * Uploads a photo.
   *
   * @param index file index number in FilesInfo.
   */
  upload(index: number): Promise<void> {

    // creates new photo
    const newPhoto = {
      base64: this.filesInfo[index].photoBase64,
      // if theres no name given by the user, use file name instead
      name: (this.filesInfo[index].photoName.length === 0) ? this.filesInfo[index].fileName : this.filesInfo[index].photoName,
      description: this.filesInfo[index].photoDescription,
    };

    // creates photo on server
    return new Promise(resolve => this.photoService.addPhoto({
      username: this.tokenStorageService.getUser().username,
      newPhoto: newPhoto
    }).subscribe(data => {

        if (data.type === HttpEventType.UploadProgress) {
          this.progressInfo[index].value = Math.round(100 * data.loaded / data.total);
        }

        if (data.type === HttpEventType.Response) {
          // promise finished
          resolve();
        }
      },
      err => {
        this.progressInfo[index].errorMsg = err.error.message;
        this.progressInfo[index].value = 0;
      }));
  }

  /**
   * Modifies the photo name.
   *
   * @param fileInfo info of the file to modify.
   * @param photoName new file name.
   */
  modifyPhotoName(fileInfo: any, photoName: string): void {
    fileInfo.photoName = photoName;
  }

  /**
   * Modifies the photo description.
   *
   * @param fileInfo info of the file to modify.
   * @param photoDescription new file description.
   */
  modifyPhotoDescription(fileInfo: any, photoDescription: string): void {
    fileInfo.photoDescription = photoDescription;
  }

  /**
   * Choose a new currently selected prompt file so its ready to be modified.
   *
   * @param nextIndex index of the new selected prompt file.
   */
  choosePromptFile(nextIndex: number) {
    this.highLightPromptFile(this.currentPromptFileIndex, false);
    this.currentPromptFileIndex = nextIndex;
    this.highLightPromptFile(nextIndex, true);
  }

  /**
   * Switches to the previous selected prompt file in the filesInfo list.
   */
  previousPromptFile() {
    if (this.filesInfo[this.currentPromptFileIndex - 1]) {
      this.highLightPromptFile(this.currentPromptFileIndex, false);
      this.currentPromptFileIndex--;
      this.highLightPromptFile(this.currentPromptFileIndex, true);
    }
  }

  /**
   * Switches to the next selected prompt file in the filesInfo list.
   */
  nextPromptFile() {
    if (this.filesInfo[this.currentPromptFileIndex + 1]) {
      this.highLightPromptFile(this.currentPromptFileIndex, false);
      this.currentPromptFileIndex++;
      this.highLightPromptFile(this.currentPromptFileIndex, true);
    }
  }

  /**
   * Hightlight currently selected file.
   *
   * @param index index of prompt file in filesInfo.
   * @param isEnabled {@code true} if file will be highlighted; {@code false} otherwise.
   */
  highLightPromptFile(index: number, isEnabled: boolean) {

    // get photo element
    const elementImg = (<HTMLInputElement>document.getElementById("photo-" + index));
    const elementInputDescription = (<HTMLInputElement>document.getElementById("form-input-photo-description"));

    if (!elementImg) {
      this.fileSelectionMessages.push("Could not select file at index: " + index + ".");
      return;
    }

    if (isEnabled) {
      elementImg.classList.add("selected-prompt-file");
    } else {
      elementImg.classList.remove("selected-prompt-file");
    }

    if (elementInputDescription) {
      // replace the input description form with the current file photo description highlighted
      elementInputDescription.value = this.filesInfo[index].photoDescription;
    }
  }
}
