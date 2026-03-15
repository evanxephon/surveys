import { useState } from 'react';
import { HERO_ARTWORK } from '../config/artwork';

interface IntroScreenProps {
  onStart: () => void;
}

export function IntroScreen({ onStart }: IntroScreenProps) {
  const [imageVisible, setImageVisible] = useState(true);

  return (
    <section
      onClick={onStart}
      className="relative flex min-h-[100svh] cursor-pointer flex-col justify-between overflow-hidden px-6 pb-10 pt-8 sm:px-8"
    >
      <div className="absolute inset-0">
        {imageVisible ? (
          <img
            src={HERO_ARTWORK.imageUrl}
            alt={HERO_ARTWORK.title}
            className="h-full w-full object-cover opacity-95 contrast-[0.96] saturate-[0.82]"
            loading="eager"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onError={() => setImageVisible(false)}
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_0_35%),linear-gradient(135deg,#cbc1c9,#9f98a7)]" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,6,7,0.22),rgba(8,6,7,0.58))]" />
      </div>

      <div className="relative space-y-6">
        <div className="flex justify-end">
          <p className="text-[11px] tracking-[0.22em] text-fog/62">点击任意位置继续</p>
        </div>
        <div className="space-y-6 pt-10 sm:pt-12">
          <p className="max-w-[14rem] font-display text-[1.95rem] leading-[1.04] text-fog sm:max-w-[21rem] sm:text-[2.8rem]">
            如果穿越到
            <br />
            陀思妥耶夫斯基的作品中，
            <br />
            你会是哪一位角色呢？
          </p>
          <p className="max-w-[14rem] text-[14px] leading-7 text-fog/74 sm:max-w-[18rem]">
            有些名字并不写在户籍上，而写在你如何爱、如何受苦、如何独自熬过漫长黑夜的方式里。
          </p>
        </div>
      </div>
      <div />
    </section>
  );
}
