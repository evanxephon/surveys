import type { RoleId } from '../types';

export const PORTRAIT_IMAGES: Partial<Record<RoleId, string>> = {
  raskolnikov: new URL('../pics/raskolnikov.jpg', import.meta.url).href,
  sonya: new URL('../pics/sonya.jpg', import.meta.url).href,
  myshkin: new URL('../pics/myshkin.jpg', import.meta.url).href,
  nastasya: new URL('../pics/nastasya.jpg', import.meta.url).href,
  ivan: new URL('../pics/ivan.jpg', import.meta.url).href,
  alyosha: new URL('../pics/alyosha.jpg', import.meta.url).href,
  dmitri: new URL('../pics/dmitri.jpg', import.meta.url).href,
  grushenka: new URL('../pics/grushenka.jpg', import.meta.url).href,
  smerdyakov: new URL('../pics/smerdyakov.jpg', import.meta.url).href,
  stavrogin: new URL('../pics/stavrogin.jpg', import.meta.url).href,
  kirillov: new URL('../pics/kirillov.jpg', import.meta.url).href,
  underground: new URL('../pics/underground.jpg', import.meta.url).href,
  alexei: new URL('../pics/alexei.jpg', import.meta.url).href,
  nelly: new URL('../pics/nelly.jpg', import.meta.url).href,
  devushkin: new URL('../pics/devushkin.jpg', import.meta.url).href,
  netochka: new URL('../pics/netochka.jpg', import.meta.url).href,
  dreamer: new URL('../pics/dreamer.jpg', import.meta.url).href,
  nastenka: new URL('../pics/nastenka.jpg', import.meta.url).href,
};
