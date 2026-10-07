import { Component, OnDestroy, OnInit, input, output } from '@angular/core';

/**
 * Reusable "crop before upload" popup.
 *
 * The picture sits behind a fixed crop frame. The user drags it to move,
 * and uses the slider / mouse wheel to zoom. When they confirm, the visible
 * part is cut out, shrunk to a sensible size and emitted as a data URL.
 *
 * Usage:
 *   <app-image-cropper [file]="file" [aspectRatio]="1" [round]="true"
 *       (cropped)="onCropped($event)" (cancelled)="onCancelled()" />
 */
@Component({
  selector: 'app-image-cropper',
  standalone: true,
  templateUrl: './image-cropper.component.html',
  styleUrl: './image-cropper.component.css'
})
export class ImageCropperComponent implements OnInit, OnDestroy {

  /** Either a freshly chosen file ... */
  file = input<File | null>(null);
  /** ... or the address / data URL of an image that is already saved. */
  src = input<string | null>(null);
  title = input<string>('Crop image');
  subtitle = input<string>('');
  /** width / height of the crop frame (1 = square, 4/3 = landscape ...) */
  aspectRatio = input<number>(1);
  /** show the frame as a circle (profile photos) */
  round = input<boolean>(false);
  /** longest side of the saved image in pixels */
  outputSize = input<number>(700);

  cropped = output<string>();
  cancelled = output<void>();

  // Size of the crop frame on screen
  readonly frameWidth = 300;
  frameHeight = 300;

  ready = false;
  failed = false;
  imageUrl = '';
  private objectUrl: string | null = null;

  zoom = 1;
  readonly maxZoom = 4;

  // Size and position of the picture inside the frame
  displayWidth = 0;
  displayHeight = 0;
  posX = 0;
  posY = 0;

  private image = new Image();
  private baseScale = 1;
  private dragging = false;
  private lastX = 0;
  private lastY = 0;

  ngOnInit() {

    this.frameHeight = Math.round(this.frameWidth / this.aspectRatio());
    const file = this.file();
    const src = this.src();

    if (file) {
      this.objectUrl = URL.createObjectURL(file);
      this.imageUrl = this.objectUrl;
    } else if (src) {
      this.imageUrl = src;

      // Images from another website can only be cropped if that site allows it
      if (/^https?:\/\//i.test(src) && !src.startsWith(window.location.origin)) {
        this.image.crossOrigin = 'anonymous';
      }
    } else {
      this.failed = true;
      return;
    }

    this.image.onload = () => {
      // Smallest scale at which the picture still covers the whole frame
      this.baseScale = Math.max(
        this.frameWidth / this.image.naturalWidth,
        this.frameHeight / this.image.naturalHeight
      );
      this.applyScale(1, true);
      this.ready = true;
    };

    this.image.onerror = () => {
      this.failed = true;
    };

    this.image.src = this.imageUrl;
  }

  ngOnDestroy() {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }
  }

  private get scale(): number {
    return this.baseScale * this.zoom;
  }

  /** Changes the zoom while keeping the middle of the frame where it is. */
  private applyScale(newZoom: number, center = false) {

    const oldScale = this.scale;
    const centerX = (this.frameWidth / 2 - this.posX) / oldScale;
    const centerY = (this.frameHeight / 2 - this.posY) / oldScale;

    this.zoom = Math.min(this.maxZoom, Math.max(1, newZoom));

    this.displayWidth = this.image.naturalWidth * this.scale;
    this.displayHeight = this.image.naturalHeight * this.scale;

    if (center) {
      this.posX = (this.frameWidth - this.displayWidth) / 2;
      this.posY = (this.frameHeight - this.displayHeight) / 2;
    } else {
      this.posX = this.frameWidth / 2 - centerX * this.scale;
      this.posY = this.frameHeight / 2 - centerY * this.scale;
    }

    this.clampPosition();
  }

  /** The picture must always cover the frame - no empty gaps. */
  private clampPosition() {
    this.posX = Math.min(0, Math.max(this.frameWidth - this.displayWidth, this.posX));
    this.posY = Math.min(0, Math.max(this.frameHeight - this.displayHeight, this.posY));
  }

  // ---------- Zoom ----------

  onZoomInput(event: Event) {
    this.applyScale(Number((event.target as HTMLInputElement).value));
  }

  onWheel(event: WheelEvent) {
    event.preventDefault();
    this.applyScale(this.zoom + (event.deltaY < 0 ? 0.1 : -0.1));
  }

  reset() {
    this.applyScale(1, true);
  }

  // ---------- Drag to move ----------

  onPointerDown(event: PointerEvent) {
    this.dragging = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  onPointerMove(event: PointerEvent) {

    if (!this.dragging) {
      return;
    }

    this.posX += event.clientX - this.lastX;
    this.posY += event.clientY - this.lastY;
    this.lastX = event.clientX;
    this.lastY = event.clientY;

    this.clampPosition();
  }

  onPointerUp() {
    this.dragging = false;
  }

  // ---------- Result ----------

  confirm() {

    if (!this.ready) {
      return;
    }

    // The part of the original picture that is inside the frame
    const sx = -this.posX / this.scale;
    const sy = -this.posY / this.scale;
    const sw = this.frameWidth / this.scale;
    const sh = this.frameHeight / this.scale;

    const max = this.outputSize();
    const ratio = this.aspectRatio();

    let outW: number;
    let outH: number;

    if (ratio >= 1) {
      outW = Math.min(max, Math.round(sw));
      outH = Math.round(outW / ratio);
    } else {
      outH = Math.min(max, Math.round(sh));
      outW = Math.round(outH * ratio);
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, outW);
    canvas.height = Math.max(1, outH);

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      this.failed = true;
      return;
    }

    ctx.drawImage(this.image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    // PNG keeps transparency; everything else is saved as a smaller JPEG
    const source = this.src() ?? '';
    const isPng = this.file()?.type === 'image/png'
      || /^data:image\/png/i.test(source)
      || /\.png(\?|$)/i.test(source);

    try {
      this.cropped.emit(canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.85));
    } catch {
      // The browser blocks reading pixels of images from other websites
      this.failed = true;
    }
  }

  cancel() {
    this.cancelled.emit();
  }
}