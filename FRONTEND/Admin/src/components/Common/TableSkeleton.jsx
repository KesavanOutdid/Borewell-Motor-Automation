import React from 'react';
import './TableSkeleton.css';

const TableSkeleton = ({ rows = 5, columns = 7 }) => {
    return (
        <>
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <tr key={`skeleton-row-${rowIndex}`}>
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <td key={`skeleton-col-${colIndex}`} className="align-middle text-center">
                            <div className="skeleton-box"></div>
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
};

export default TableSkeleton;
