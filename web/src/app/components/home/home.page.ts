import { HttpEvent, HttpEventType } from '@angular/common/http';
import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { LoadingController, ModalController } from '@ionic/angular';
import { ImageService } from 'src/app/services/image/image.service';
import { DefaultOutlineThickness, ImageLabel, OutlineErrorMessage, UploadErrorMessage, White } from '../../../assets/constants';
import { Dress } from '../../../assets/dress';
import { DownloadComponent } from '../download/download.component';

@Component({
  selector: 'home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class HomePage {
  constructor(private imageService: ImageService, private loadingCtrl: LoadingController, private modalCtrl: ModalController) {}
  @ViewChild('file') file: any;
  originalImage = '';
  segmentedImage = '';
  originalImageWithOutline = '';
  segmentedImageWithOutline = '';
  outlineColor = White;
  outlineThickness: '0' | '1' | '2' = DefaultOutlineThickness;
  segnetSectionColor: string;
  serialID: string;

  openHelpPage() {
    window.open('/help');
  }

  addFiles() {
    this.file.nativeElement.click();
  }

  async uploadTestFile() {
    await this.showLoading();
    this.uploadImage(Dress, 'dress.png');
  }

  async showLoading(): Promise<void> {
    const loading = await this.loadingCtrl.create({
      message: `Uploading... ${this.imageService.getUploadProgress()}%`
    });

    await loading.present();
    this.imageService.setLoadingElement(document.querySelector('div.loading-wrapper div.loading-content'));
  }

  dismissLoading(): void {
    this.loadingCtrl.dismiss();
    this.imageService.resetProgress();
  }

  handleUploadEvent(loaded: number, total: number) {
    this.imageService.setUploadProgress(Math.round((loaded / total) * 100));
  }

  handleDownloadEvent(loaded: number, total: number) {
    this.imageService.setDownloadProgress(Math.round((loaded / total) * 100));
  }

  async onFilesAdded() {
    if (this.file?.nativeElement?.files?.length) {
      const file: File = this.file.nativeElement.files[0];
      const reader = new FileReader();
      await this.showLoading();

      reader.addEventListener('load', (event: any) => this.uploadImage(event.target.result, file.name));

      reader.readAsDataURL(file);
    }
  }

  uploadImage(src: string, fileName: string) {
    this.imageService.uploadImage(src, fileName).subscribe(
      (event: HttpEvent<any>) => {
        this.handleResponseForUploadImage(event);
      },
      () => this.imageService.handleError(UploadErrorMessage)
    );
  }

  handleResponseForUploadImage(event: HttpEvent<any>) {
    switch (event.type) {
      case HttpEventType.UploadProgress: {
        this.handleUploadEvent(event.loaded, event.total);
        break;
      }
      case HttpEventType.DownloadProgress: {
        this.handleDownloadEvent(event.loaded, event.total);
        break;
      }
      case HttpEventType.Response: {
        if (event.body && event.body.segmentedImage && event.body.serialID && event.body.originalImage) {
          this.originalImage = event.body.originalImage;
          this.segmentedImage = event.body.segmentedImage;
          this.serialID = event.body.serialID;
          this.dismissLoading();
        } else {
          this.imageService.handleError(UploadErrorMessage);
        }

        break;
      }
    }
  }

  onProcessedImageClick(event: any): void {
    if (!this.segmentedImageWithOutline) {
      const pixelData = this.getPixelData(event);
      this.segnetSectionColor = this.convertFromRGBAToHex(pixelData);
    }
  }

  /*
    When the processed image is clicked, create a canvas object.
    Then get the ImageData from the fired event.
  */
  getPixelData(event: any) {
    const id = event.target.id;
    const img: any = document.getElementById(id);
    const canvas: any = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height);
    return canvas.getContext('2d').getImageData(event.offsetX, event.offsetY, 1, 1).data;
  }

  convertFromRGBAToHex(rgb: any[]) {
    let [r, g, b] = rgb;

    r = r.toString(16);
    g = g.toString(16);
    b = b.toString(16);

    if (r.length === 1) {
      r = '0' + r;
    }

    if (g.length === 1) {
      g = '0' + g;
    }

    if (b.length === 1) {
      b = '0' + b;
    }

    return '#' + r + g + b;
  }

  readyToOutline(): boolean {
    return !!this.outlineColor && !!this.outlineThickness && !!this.segnetSectionColor;
  }

  getSegmentColorLabel(): string {
    return `You selected ${this.segnetSectionColor}, which looks like this:`;
  }

  getLabelForOriginalImage(): string {
    return !!this.originalImageWithOutline ? ImageLabel.OutlinedOriginal : ImageLabel.Original;
  }

  getLabelForSegmentedImage(): string {
    return !!this.segmentedImageWithOutline ? ImageLabel.OutlinedSegmented : ImageLabel.Segmented;
  }

  getImageStringForOriginalImage(): string {
    if (!!this.originalImage) {
      return !!this.originalImageWithOutline ? this.originalImageWithOutline : this.originalImage;
    }
  }

  getImageStringForSegmentedImage(): string {
    if (!!this.segmentedImage) {
      return !!this.segmentedImageWithOutline ? this.segmentedImageWithOutline : this.segmentedImage;
    }
  }

  changeThickness(event: any) {
    this.outlineThickness = event.detail.value;
  }

  async getOutlinedImages() {
    await this.showLoading();

    this.imageService.getOutlinedImages(this.segnetSectionColor, this.outlineThickness, this.outlineColor, this.serialID).subscribe(
      (event: HttpEvent<any>) => {
        this.handleResponseForOutlinedImages(event);
      },
      () => this.imageService.handleError(OutlineErrorMessage)
    );
  }

  clearOutline(): void {
    this.segmentedImageWithOutline = '';
    this.originalImageWithOutline = '';
  }

  handleResponseForOutlinedImages(event: HttpEvent<any>) {
    switch (event.type) {
      case HttpEventType.UploadProgress: {
        this.handleUploadEvent(event.loaded, event.total);
        break;
      }
      case HttpEventType.DownloadProgress: {
        this.handleDownloadEvent(event.loaded, event.total);
        break;
      }
      case HttpEventType.Response: {
        if (event.body && event.body.originalOutline && event.body.segmentedOutline) {
          this.originalImageWithOutline = event.body.originalOutline;
          this.segmentedImageWithOutline = event.body.segmentedOutline;
          this.dismissLoading();
        } else {
          this.imageService.handleError(OutlineErrorMessage);
        }
        break;
      }
    }
  }

  async download(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: DownloadComponent,
      componentProps: { serialID: this.serialID }
    });

    modal.onDidDismiss().then((response) => {
      this.handleDismissForDownloadModal(response);
    });

    return await modal.present();
  }

  handleDismissForDownloadModal(response: any) {
    if (response && response.data) {
      this.outlineColor = White;
      this.outlineThickness = DefaultOutlineThickness;
      this.segnetSectionColor = undefined;
      this.serialID = undefined;
      this.originalImage = '';
      this.segmentedImage = '';
      this.originalImageWithOutline = '';
      this.segmentedImageWithOutline = '';
      this.imageService.showSuccessfulDownload();
      this.dismissLoading();
    }
  }
}
