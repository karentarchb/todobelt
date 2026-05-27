import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { register as registerSwiper } from 'swiper/element/bundle';

import { BellLogoComponent } from '@shared/components/bell-logo/bell-logo.component';
import { PrimaryButtonComponent } from '@shared/components/primary-button/primary-button.component';
import { OnboardingService } from '@core/services/onboarding.service';

registerSwiper();

interface Slide {
  eyebrow: string;
  title: string;
  subtitle: string;
}

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [IonicModule, BellLogoComponent, PrimaryButtonComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./onboarding.page.scss'],
  templateUrl: './onboarding.page.html',
})
export class OnboardingPage {
  private readonly router = inject(Router);
  private readonly onboarding = inject(OnboardingService);

  @ViewChild('swiperEl', { static: false }) swiperEl?: ElementRef<HTMLElement & { swiper?: { slideNext: () => void; slidePrev: () => void; activeIndex: number } }>;

  readonly slides: Slide[] = [
    {
      eyebrow: 'Enfoque',
      title: 'Enfócate en lo importante',
      subtitle: 'Organiza tu día sin sentirte saturada.',
    },
    {
      eyebrow: 'Recompensas',
      title: 'Cada tarea suma',
      subtitle: 'Gana monedas y canjéalas por un café, un helado o una pausa real.',
    },
    {
      eyebrow: 'Productividad amable',
      title: 'Tu ritmo, tu día',
      subtitle: 'TODO BELT te acompaña con calma para que avances sin estrés.',
    },
  ];

  readonly activeIndex = signal(0);
  readonly isLast = signal(false);

  onSlideChange(ev: Event): void {
    const target = ev.target as HTMLElement & { swiper?: { activeIndex: number } };
    const idx = target.swiper?.activeIndex ?? 0;
    this.activeIndex.set(idx);
    this.isLast.set(idx === this.slides.length - 1);
  }

  next(): void {
    const swiper = this.swiperEl?.nativeElement.swiper;
    if (!swiper) return;
    if (this.activeIndex() < this.slides.length - 1) {
      swiper.slideNext();
    } else {
      void this.finish();
    }
  }

  goTo(index: number): void {
    const target = this.swiperEl?.nativeElement as (HTMLElement & { swiper?: { slideTo: (i: number) => void } }) | undefined;
    target?.swiper?.slideTo(index);
  }

  skip(): void {
    void this.finish();
  }

  async finish(): Promise<void> {
    await this.onboarding.complete();
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
