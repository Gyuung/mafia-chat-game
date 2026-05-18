import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Mafia Chat Game Docs',
  tagline: '게임 룰, 변경 이력, 다음 작업을 관리하는 문서 사이트',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://gyuung.github.io',
  baseUrl: '/',
  organizationName: 'Gyuung',
  projectName: 'mafia-chat-game',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'ko',
    locales: ['ko'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/Gyuung/mafia-chat-game/tree/main/docs-site/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Mafia Chat Game Docs',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: '문서',
        },
        {
          href: 'http://localhost:3000',
          label: '게임',
          position: 'right',
        },
        {
          href: 'https://github.com/Gyuung/mafia-chat-game',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: '게임 룰',
              to: '/docs/game-rules',
            },
            {
              label: '변경 이력',
              to: '/docs/changelog',
            },
            {
              label: '로드맵',
              to: '/docs/roadmap',
            },
          ],
        },
        {
          title: 'Project',
          items: [
            {
              label: '게임 실행',
              href: 'http://localhost:3000',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/Gyuung/mafia-chat-game',
            },
          ],
        },
        {
          title: 'Workflow',
          items: [
            {
              label: '세션 이어하기',
              to: '/docs/session-continuation',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Mafia Chat Game.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
