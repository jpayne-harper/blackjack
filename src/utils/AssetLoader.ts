import { ImageMapper } from './ImageMapper';
import { Card, Suit, Rank } from '../types/Card';

export class AssetLoader {
  private loadedImages: Map<string, HTMLImageElement> = new Map();
  private loadPromises: Map<string, Promise<HTMLImageElement>> = new Map();

  /**
   * Preload a single image
   */
  private loadImage(src: string): Promise<HTMLImageElement> {
    if (this.loadedImages.has(src)) {
      return Promise.resolve(this.loadedImages.get(src)!);
    }

    if (this.loadPromises.has(src)) {
      return this.loadPromises.get(src)!;
    }

    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.loadedImages.set(src, img);
        this.loadPromises.delete(src);
        resolve(img);
      };
      img.onerror = () => {
        this.loadPromises.delete(src);
        reject(new Error(`Failed to load image: ${src}`));
      };
      img.src = src;
    });

    this.loadPromises.set(src, promise);
    return promise;
  }

  /**
   * Preload all card images
   */
  async preloadAllCards(): Promise<void> {
    const suits = [Suit.CLUBS, Suit.DIAMONDS, Suit.HEARTS, Suit.SPADES];
    const ranks = [
      Rank.ACE, Rank.TWO, Rank.THREE, Rank.FOUR, Rank.FIVE, Rank.SIX,
      Rank.SEVEN, Rank.EIGHT, Rank.NINE, Rank.TEN, Rank.JACK, Rank.QUEEN, Rank.KING
    ];

    const loadPromises: Promise<HTMLImageElement>[] = [];

    // Load all card images
    for (const suit of suits) {
      for (const rank of ranks) {
        const card: Card = {
          suit,
          rank,
          value: 0,
          imagePath: ''
        };
        card.imagePath = ImageMapper.getCardImagePath(card);
        loadPromises.push(
          this.loadImage(card.imagePath).catch(err => {
            console.warn(`Failed to load card image: ${card.imagePath}`, err);
            throw err;
          })
        );
      }
    }

    // Load card back
    loadPromises.push(
      this.loadImage(ImageMapper.getCardBackPath()).catch(err => {
        console.warn(`Failed to load card back: ${ImageMapper.getCardBackPath()}`, err);
        throw err;
      })
    );

    // Load table background
    loadPromises.push(
      this.loadImage(ImageMapper.getTableBackgroundPath()).catch(err => {
        console.warn(`Failed to load table background: ${ImageMapper.getTableBackgroundPath()}`, err);
        throw err;
      })
    );

    // Use Promise.allSettled to continue even if some images fail
    const results = await Promise.allSettled(loadPromises);
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      console.warn(`${failures.length} images failed to load`);
      // Only throw if critical images failed
      const criticalFailed = results.slice(-2).some(r => r.status === 'rejected');
      if (criticalFailed) {
        throw new Error('Critical images (card back or table background) failed to load');
      }
    }
  }

  /**
   * Preload critical images first (card back, table background)
   */
  async preloadCritical(): Promise<void> {
    const criticalImages = [
      ImageMapper.getCardBackPath(),
      ImageMapper.getTableBackgroundPath()
    ];

    const results = await Promise.allSettled(
      criticalImages.map(src => 
        this.loadImage(src).catch(err => {
          console.error(`Failed to load critical image: ${src}`, err);
          throw err;
        })
      )
    );

    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      const failedPaths = criticalImages.filter((_, i) => results[i].status === 'rejected');
      throw new Error(`Failed to load critical images: ${failedPaths.join(', ')}`);
    }
  }

  /**
   * Get loaded image element
   */
  getImage(src: string): HTMLImageElement | undefined {
    return this.loadedImages.get(src);
  }

  /**
   * Check if image is loaded
   */
  isImageLoaded(src: string): boolean {
    return this.loadedImages.has(src);
  }
}

