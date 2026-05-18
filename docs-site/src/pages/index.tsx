import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

const appUrl = process.env.APP_URL ?? 'http://localhost:3000';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();

  return (
    <header className={styles.heroBanner}>
      <div className="container">
        <Heading as="h1" className={styles.title}>
          {siteConfig.title}
        </Heading>
        <p className={styles.subtitle}>{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link className="button button--primary button--lg" to="/docs/intro">
            문서 보기
          </Link>
          <Link className="button button--secondary button--lg" href={appUrl}>
            게임으로 이동
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();

  return (
    <Layout title={siteConfig.title} description="Mafia Chat Game project documentation">
      <HomepageHeader />
      <main className={styles.main}>
        <section className={styles.section}>
          <Heading as="h2">문서 범위</Heading>
          <div className={styles.grid}>
            <article>
              <h3>게임 룰</h3>
              <p>역할, 밤 행동, 낮 심문, 투표, 승패 조건을 관리합니다.</p>
            </article>
            <article>
              <h3>변경 이력</h3>
              <p>게임 기능과 문서 구조 변경을 버전별로 기록합니다.</p>
            </article>
            <article>
              <h3>작업 이어가기</h3>
              <p>Codex 세션이 끊겨도 다음 작업자가 같은 맥락에서 재개할 수 있게 합니다.</p>
            </article>
          </div>
        </section>
      </main>
    </Layout>
  );
}
