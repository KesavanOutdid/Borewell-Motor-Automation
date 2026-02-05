import React from 'react';
import './CardSkeleton.css';

const CardSkeleton = ({ cards = 5 }) => {
    return (
        <div className="card-skeleton-grid">
            {Array.from({ length: cards }).map((_, index) => (
                <div key={`card-skeleton-${index}`} className="card-skeleton">
                    <div className="card-skeleton-image"></div>
                    <div className="card-skeleton-body">
                        <div className="card-skeleton-title"></div>
                        <div className="card-skeleton-text"></div>
                        <div className="card-skeleton-text short"></div>
                        <div className="card-skeleton-footer">
                            <div className="card-skeleton-button"></div>
                            <div className="card-skeleton-button"></div>
                            <div className="card-skeleton-button"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default CardSkeleton;
