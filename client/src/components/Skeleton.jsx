import React from 'react';

const Skeleton = ({ width, height, borderRadius = '4px', className = '' }) => {
    return (
        <div
            className={`skeleton-loader ${className}`}
            style={{
                width: width || '100%',
                height: height || '20px',
                borderRadius: borderRadius,
                background: 'linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-hover) 50%, var(--bg-tertiary) 75%)',
                backgroundSize: '200% 100%',
                animation: 'skeleton-loading 1.5s infinite linear'
            }}
        />
    );
};

export default Skeleton;
