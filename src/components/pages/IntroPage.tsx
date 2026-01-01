import { motion } from 'framer-motion';

import type { WrappedData } from '../../types';

import { PageContainer } from '../PageContainer';
import styles from './Page.module.css';

interface IntroPageProps {
  data: WrappedData;
  onNext?: () => void;
}

export function IntroPage({ data, onNext }: IntroPageProps) {
  const transactionCount = data.allTransactions?.length || 0;
  const monthCount = data.monthlyData.length;

  return (
    <PageContainer id="intro-page">
      <motion.div
        className={styles.content}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <motion.h1
          className={styles.title}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          Your {data.year} Budget
        </motion.h1>
        <motion.div
          className={styles.subtitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Year in Review
        </motion.div>

        {/* Preview Stats Card */}
        <motion.div
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '24px',
            padding: '3rem 2rem',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            marginTop: '3rem',
            maxWidth: '600px',
            margin: '3rem auto 0',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <motion.p
            style={{
              fontSize: '1.3rem',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '2rem',
              lineHeight: '1.6',
            }}
          >
            You&apos;ve tracked{' '}
            <strong style={{ color: '#667eea' }}>{transactionCount.toLocaleString('en-US')}</strong>{' '}
            transactions
            <br />
            across <strong style={{ color: '#764ba2' }}>{monthCount}</strong> months this year
          </motion.p>

          <motion.div
            style={{
              width: '100%',
              height: '2px',
              background:
                'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
              margin: '2rem 0',
            }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          />

          <motion.p
            style={{
              fontSize: '1.1rem',
              color: 'rgba(255, 255, 255, 0.8)',
              lineHeight: '1.8',
              marginTop: '2rem',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            Lets see how you did this year!
            <br />
            <span
              style={{
                fontSize: '0.95rem',
                color: 'rgba(255, 255, 255, 0.7)',
                marginTop: '0.5rem',
                display: 'block',
              }}
            >
              Click{' '}
              <motion.strong
                style={{
                  color: '#f093fb',
                  cursor: onNext ? 'pointer' : 'default',
                  textDecoration: onNext ? 'underline' : 'none',
                  display: 'inline-block',
                }}
                onClick={onNext}
                whileHover={onNext ? { scale: 1.1 } : {}}
                whileTap={onNext ? { scale: 0.95 } : {}}
              >
                &quot;Next&quot;
              </motion.strong>{' '}
              to explore your insights →
            </span>
          </motion.p>
        </motion.div>

        {/* Decorative elements */}
        <motion.div
          style={{
            position: 'fixed',
            top: '10%',
            left: '5%',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background:
              'linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2))',
            filter: 'blur(40px)',
            zIndex: 0,
            pointerEvents: 'none',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          style={{
            position: 'fixed',
            bottom: '15%',
            right: '8%',
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            background:
              'linear-gradient(135deg, rgba(240, 147, 251, 0.2), rgba(67, 233, 123, 0.2))',
            filter: 'blur(50px)',
            zIndex: 0,
            pointerEvents: 'none',
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        />
      </motion.div>
    </PageContainer>
  );
}
