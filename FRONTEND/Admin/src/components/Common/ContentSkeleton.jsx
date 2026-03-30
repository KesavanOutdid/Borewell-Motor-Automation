import React from 'react';
import './ContentSkeleton.css';

const ContentSkeleton = () => {
    return (
        <div className="content-skeleton-wrapper">
            <div className="skeleton-card">
                <div className="skeleton-header"></div>
                <div className="skeleton-content">
                    <div className="skeleton-row">
                        <div className="skeleton-label"></div>
                        <div className="skeleton-value"></div>
                    </div>
                    <div className="skeleton-row">
                        <div className="skeleton-label"></div>
                        <div className="skeleton-value"></div>
                    </div>
                    <div className="skeleton-row">
                        <div className="skeleton-label"></div>
                        <div className="skeleton-value"></div>
                    </div>
                    <div className="skeleton-row">
                        <div className="skeleton-label"></div>
                        <div className="skeleton-value"></div>
                    </div>
                    <div className="skeleton-row">
                        <div className="skeleton-label"></div>
                        <div className="skeleton-value"></div>
                    </div>
                    <div className="skeleton-row">
                        <div className="skeleton-label"></div>
                        <div className="skeleton-value"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContentSkeleton;
