export interface ArtworkConfig {
  title: string;
  imageUrl: string;
  credit: string;
}

export const HERO_ARTWORK: ArtworkConfig = {
  title: '《白夜》插画',
  imageUrl: '/images/white-nights-hero.webp',
  credit: 'User provided reference image',
};

export const SOURCE_ARTWORK: Record<string, ArtworkConfig> = {
  '《罪与罚》': {
    title: '《罪与罚》早期版本扉页',
    imageUrl:
      'https://commons.wikimedia.org/wiki/Special:FilePath/LL%20Dostojewski%20TB%20WP.jpg',
    credit: 'Wikimedia Commons · public domain',
  },
  '《白痴》': {
    title: '《白痴》旧版扉页',
    imageUrl:
      'https://commons.wikimedia.org/wiki/Special:FilePath/%D0%94%D0%BE%D1%81%D1%82%D0%BE%D0%B5%D0%B2%D1%81%D0%BA%D0%B8%D0%B9%20%D0%A4%D1%91%D0%B4%D0%BE%D1%80.%20%D0%98%D0%B4%D0%B8%D0%BE%D1%82.%20%D0%A7%D0%B0%D1%81%D1%82%D0%B8%201%20%D0%B8%202.%20%D0%A2%D0%B8%D1%82%D1%83%D0%BB%D1%8C%D0%BD%D1%8B%D0%B9%20%D0%BB%D0%B8%D1%81%D1%82%20%281874%29.jpg',
    credit: 'Wikimedia Commons · public domain',
  },
  '《卡拉马佐夫兄弟》': {
    title: '《卡拉马佐夫兄弟》初版扉页',
    imageUrl:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Dostoevsky-Brothers_Karamazov.jpg',
    credit: 'Wikimedia Commons · public domain',
  },
  '《群魔》': {
    title: '《群魔》1873 年版首页',
    imageUrl:
      'https://commons.wikimedia.org/wiki/Special:FilePath/The%20first%20edition%20of%20Dostoevsky%27s%20novel%20Demons%20Petersburg%201873.JPG',
    credit: 'Wikimedia Commons · public domain',
  },
  '《地下室手记》': {
    title: '《地下室手记》旧版封面页',
    imageUrl:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Dosto%C3%AFevski%20-%20Le%20Sous-sol%2C%201909.djvu?page=1',
    credit: 'Wikimedia Commons · public domain',
  },
  '《赌徒》': {
    title: '《赌徒》旧版封面页',
    imageUrl:
      'https://commons.wikimedia.org/wiki/Special:FilePath/The%20Gambler%20%28novel%29%201866%20first%20edition%20cover.jpg',
    credit: 'Wikimedia Commons · public domain',
  },
  '《被侮辱与被损害的》': {
    title: '《被侮辱与被损害的》插画页',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/6/65/Humiliated_and_Insulted_illustration_by_Nikolay_Karazin_%281893%29.jpg',
    credit: 'Wikimedia Commons · public domain',
  },
  '《穷人》': {
    title: '《穷人》1847 年版封面',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Poor_Folk-1.png',
    credit: 'Wikimedia Commons · public domain',
  },
  '《涅朵奇卡·涅兹瓦诺娃》': {
    title: '《涅朵奇卡·涅兹瓦诺娃》1849 年版',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/d/d9/Netochka_Nezvanova_%281849%29.jpg',
    credit: 'Wikimedia Commons · public domain',
  },
  '《白夜》': {
    title: '《白夜》1865 年版扉页',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/6/68/Dostoyevski_-_White_Nights_%281865%29.jpg',
    credit: 'Wikimedia Commons · public domain',
  },
};
