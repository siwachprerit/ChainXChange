import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
    Github,
    Linkedin,
    Mail,
    Cpu,
    Zap,
    Shield,
    Infinity,
    Sparkles,
    Code,
    Layers,
    Terminal
} from 'lucide-react';

const About = () => {
    const { scrollYProgress } = useScroll();
    const rotate = useTransform(scrollYProgress, [0, 1], [0, 360]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
        }
    };

    return (
        <motion.div
            className="container"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            style={{ position: 'relative', overflow: 'hidden', paddingBottom: '10rem' }}
        >
            {/* Kinetic Abstract Background Elements */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 90, 0],
                    x: [0, 50, 0]
                }}
                transition={{ duration: 20, repeat: Infinity }}
                style={{
                    position: 'absolute',
                    top: '10%',
                    right: '-5%',
                    width: '400px',
                    height: '400px',
                    background: 'radial-gradient(circle, rgba(240, 185, 11, 0.15) 0%, transparent 70%)',
                    filter: 'blur(80px)',
                    zIndex: -1
                }}
            />

            <motion.div
                animate={{
                    scale: [1, 1.5, 1],
                    y: [0, 100, 0]
                }}
                transition={{ duration: 15, repeat: Infinity }}
                style={{
                    position: 'absolute',
                    bottom: '20%',
                    left: '-10%',
                    width: '500px',
                    height: '500px',
                    background: 'radial-gradient(circle, rgba(2, 192, 118, 0.1) 0%, transparent 70%)',
                    filter: 'blur(100px)',
                    zIndex: -1
                }}
            />

            {/* Hero Section - The "Me" Perspective */}
            <motion.div
                style={{ textAlign: 'center', marginTop: '4rem', marginBottom: '8rem' }}
                variants={{
                    hidden: { opacity: 0, scale: 0.8 },
                    visible: { opacity: 1, scale: 1, transition: { type: 'spring', damping: 12 } }
                }}
            >
                <motion.div
                    style={{
                        display: 'inline-block',
                        padding: '0.5rem 1.5rem',
                        borderRadius: '100px',
                        background: 'rgba(240, 185, 11, 0.1)',
                        border: '1px solid rgba(240, 185, 11, 0.3)',
                        color: 'var(--accent-primary)',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        marginBottom: '2rem'
                    }}
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                >
                    Built by Prerit
                </motion.div>

                <h1 style={{
                    fontSize: 'clamp(3rem, 10vw, 6rem)',
                    fontWeight: 900,
                    lineHeight: 0.9,
                    letterSpacing: '-0.05em',
                    marginBottom: '2rem',
                    color: 'var(--text-primary)'
                }}>
                    Trade &<br />
                    <span style={{
                        background: 'linear-gradient(90deg, #f0b90b, #fff, #f0b90b)',
                        backgroundSize: '200% auto',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        animation: 'shine 3s linear infinite'
                    }}>Feel the future of web3</span>
                </h1>

                <p style={{
                    maxWidth: '650px',
                    margin: '0 auto',
                    fontSize: '1.25rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6
                }}>
                    ChainXChange isn't just an exchange. It's my vision of a frictionless,
                    high-velocity financial engine designed for the next generation of traders.
                </p>
            </motion.div>

            {/* Bento Grid Layout */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(12, 1fr)',
                gridAutoRows: 'minmax(180px, auto)',
                gap: '1.5rem',
                marginBottom: '8rem'
            }}>
                {/* Large Box: My Philosophy */}
                <motion.div
                    className="card"
                    style={{
                        gridColumn: 'span 7',
                        gridRow: 'span 2',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        padding: '3rem'
                    }}
                    whileHover={{ scale: 1.01 }}
                >
                    <Terminal size={32} style={{ color: 'var(--accent-primary)', marginBottom: '1.5rem' }} />
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>My Philosophy</h2>
                    <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                        When you're trading, you should feel
                        the market, not the interface. My design focuses on radical clarity, reduction
                        of cognitive load, and sheer aesthetic pleasure. I built this to solve my own
                        frustrations with legacy platforms.
                    </p>
                </motion.div>

                {/* Small Box: Stack */}
                <motion.div
                    className="card"
                    style={{
                        gridColumn: 'span 5',
                        background: 'linear-gradient(135deg, rgba(240, 185, 11, 0.1), transparent)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}
                >
                    <Cpu size={24} />
                    <div>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>My Tech Stack</div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.6, color: 'var(--text-secondary)' }}>MERN + Vite + FramerMotion</div>
                    </div>
                </motion.div>

                {/* Small Box: Speed */}
                <motion.div
                    className="card"
                    style={{
                        gridColumn: 'span 5',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}
                >
                    <Zap size={24} color="#02c076" />
                    <div>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Velocity Oriented</div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.6, color: 'var(--text-secondary)' }}>Sub-100ms interactions</div>
                    </div>
                </motion.div>

                {/* Small Box: Secure */}
                <motion.div
                    className="card"
                    style={{
                        gridColumn: 'span 4',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                    }}
                >
                    <Shield size={24} style={{ marginBottom: '1rem' }} />
                    <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Bank-Grade</div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.6, color: 'var(--text-secondary)' }}>AES-256 Encryption</div>
                </motion.div>

                {/* Small Box: Future */}
                <motion.div
                    className="card"
                    style={{
                        gridColumn: 'span 4',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        background: 'rgba(255,255,255,0.02)'
                    }}
                >
                    <Infinity size={24} style={{ marginBottom: '1rem' }} />
                    <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Scale Ready</div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.6, color: 'var(--text-secondary)' }}>Microservices Ready</div>
                </motion.div>

                {/* Small Box: Design */}
                <motion.div
                    className="card"
                    style={{
                        gridColumn: 'span 4',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                    }}
                >
                    <Sparkles size={24} style={{ marginBottom: '1rem' }} />
                    <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Pixel Perfect</div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.6, color: 'var(--text-secondary)' }}>GenZ Aesthetic</div>
                </motion.div>
            </div>

            {/* Kinetic Quote Section */}
            <motion.div
                style={{
                    padding: '6rem 2rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: '40px',
                    textAlign: 'center',
                    marginBottom: '8rem',
                    position: 'relative',
                    overflow: 'hidden'
                }}
                viewport={{ once: true }}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
            >
                <motion.div
                    style={{
                        position: 'absolute',
                        top: '-10%',
                        left: '-10%',
                        fontSize: '15rem',
                        opacity: 0.03,
                        fontWeight: 900,
                        color: 'var(--text-primary)',
                        pointerEvents: 'none',
                        rotate: rotate
                    }}
                >
                    DESIGN
                </motion.div>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 800, maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1, color: 'var(--text-primary)' }}>
                    "Design is not just what it looks like and feels like. Design is how it works."
                </h2>
                <div style={{ marginTop: '2rem', fontWeight: 600, color: 'var(--accent-primary)' }}>— Our Goal</div>
            </motion.div>

            {/* Personal Connect Section */}
            <motion.div
                style={{ textAlign: 'center' }}
            >
                <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '3rem', color: 'var(--text-primary)' }}>Let's build <span className="text-gradient">together</span></h2>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                    <motion.a
                        whileHover={{ scale: 1.1, rotate: 2 }}
                        whileTap={{ scale: 0.9 }}
                        href="https://github.com/siwachprerit"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            padding: '1.5rem 3rem',
                            background: '#fff',
                            color: '#000',
                            borderRadius: '100px',
                            fontWeight: 800,
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            boxShadow: '0 20px 40px rgba(255,255,255,0.1)'
                        }}
                    >
                        <Github size={24} /> GITHUB
                    </motion.a>

                    <motion.a
                        whileHover={{ scale: 1.1, rotate: -2 }}
                        whileTap={{ scale: 0.9 }}
                        href="https://www.linkedin.com/in/preritsiwach/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            padding: '1.5rem 3rem',
                            background: '#0077b5',
                            color: '#fff',
                            borderRadius: '100px',
                            fontWeight: 800,
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            boxShadow: '0 20px 40px rgba(0,119,181,0.2)'
                        }}
                    >
                        <Linkedin size={24} /> LINKEDIN
                    </motion.a>

                    <motion.a
                        whileHover={{ scale: 1.1, y: -5 }}
                        whileTap={{ scale: 0.9 }}
                        href="mailto:preritsiwach1@gmail.com"
                        style={{
                            padding: '1.5rem 3rem',
                            background: 'var(--accent-primary)',
                            color: '#000',
                            borderRadius: '100px',
                            fontWeight: 800,
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            boxShadow: '0 20px 40px rgba(240,185,11,0.2)'
                        }}
                    >
                        <Mail size={24} /> EMAIL ME
                    </motion.a>
                </div>
            </motion.div>

            <style>{`
                @keyframes shine {
                    to {
                        background-position: 200% center;
                    }
                }
                .text-gradient {
                    background: linear-gradient(135deg, var(--accent-primary), #ff9332);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
            `}</style>
        </motion.div>
    );
};

export default About;
