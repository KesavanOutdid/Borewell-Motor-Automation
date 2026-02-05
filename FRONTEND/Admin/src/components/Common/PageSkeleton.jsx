import React from 'react';
import './PageSkeleton.css';

const PageSkeleton = () => {
    return (
        <div className="page-skeleton-wrapper">
            <div className="page-skeleton-header"></div>
            <div className="page-skeleton-content">
                <div className="page-skeleton-card">
                    <div className="page-skeleton-title"></div>
                    <div className="page-skeleton-rows">
                        <div className="page-skeleton-row"></div>
                        <div className="page-skeleton-row"></div>
                        <div className="page-skeleton-row"></div>
                        <div className="page-skeleton-row"></div>
                        <div className="page-skeleton-row"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PageSkeleton;
