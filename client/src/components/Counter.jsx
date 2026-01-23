import React from 'react';
import CountUp from 'react-countup';

const Counter = ({ value, prefix = '', suffix = '', decimals = 2 }) => {
    return (
        <CountUp
            start={0}
            end={value}
            duration={1.5}
            separator=","
            decimals={decimals}
            decimal="."
            prefix={prefix}
            suffix={suffix}
            easingFn={(t, b, c, d) => {
                t /= d / 2;
                if (t < 1) return c / 2 * t * t + b;
                t--;
                return -c / 2 * (t * (t - 2) - 1) + b;
            }}
        />
    );
};

export default Counter;
