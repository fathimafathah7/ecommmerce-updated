import { Directive, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';

@Directive({
  selector: '[appReveal]',
  standalone: true
})
export class RevealOnScrollDirective implements OnInit, OnDestroy {

  private host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private observer?: IntersectionObserver;

  ngOnInit() {

    if (typeof IntersectionObserver === 'undefined') {
      this.host.classList.add('in-view');
      return;
    }

    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          this.host.classList.add('in-view');
          this.observer?.disconnect();   // play once
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    );

    this.observer.observe(this.host);
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }
}